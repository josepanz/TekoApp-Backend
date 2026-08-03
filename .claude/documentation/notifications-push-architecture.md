# Arquitectura de notificaciones push — decisión, implementación y estado (actualizado 2026-08-02)

## Estado actual

**Implementado en esta sesión** (antes solo estaba documentado como backlog — ver historial git
para la versión anterior de este archivo si hace falta el razonamiento original completo):

- **SSE real**: `GET /notifications/stream` (`@Sse()`), respaldado por `NotificationsSseService`
  (un `Subject` compartido + `filter` por `userId`, sin `Map` manual). Cubre "la pestaña/app está
  abierta ahora mismo" — actualiza la campanita de notificaciones (`TekoApp-Web`,
  `features/notifications/components/notification-bell.tsx`) en tiempo real sin polling.
- **Web Push (VAPID) real**: `web-push` (paquete npm) + `WebPushProviderService`
  (`modules/push-provider/`). Claves en `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`
  (nunca hardcodeadas, ver `.env.example`). `GET /notifications/push/vapid-public-key` expone la
  pública (no es secreta). `POST/DELETE /notifications/push-subscriptions` para que el frontend
  registre/borre la suscripción del Service Worker (`TekoApp-Web/public/sw.js`).
- **FCM real**: `firebase-admin` (ya estaba en `package.json`, ahora sí conectado) +
  `FcmProviderService` (`modules/push-provider/`). `POST/DELETE /notifications/fcm-tokens` para
  cuando `TekoApp-Frontend-Mobile` empiece a registrar tokens. **Nadie los llama todavía** — no
  hay cliente Flutter — pero el backend ya está listo y probado (unit tests con credenciales
  inválidas/faltantes, ver `fcm-provider.service.spec.ts`).
- **Modelo de datos**: `PushSubscriptions`/`FcmTokens` en Postgres (no Mongo — se decidió relación
  FK real con `Users`, ver `modules/push-notifications-db/`), migración
  `20260802230000_add_push_subscriptions_and_fcm_tokens`.
- **`NotificationsProcessor` real**: los canales `push` (Web Push) y `fcm` (FCM) ahora buscan las
  suscripciones/tokens activos del `userId`, envían de verdad, y desactivan (`isActive: false`,
  no hard-delete) la suscripción/token si el proveedor responde "ya no existe" (404/410 en Web
  Push, `messaging/registration-token-not-registered` en FCM) — nunca reintenta indefinidamente
  contra un endpoint muerto. El canal `in_app` ahora emite por SSE (antes era un no-op).

### Por qué SSE Y Web Push (no uno u otro)

La primera versión de esta decisión (ver historial git) argumentaba Web Push por sobre SSE
razonando "o uno o el otro". Eso estaba mal planteado: **no son sustitutos, son complementarios**,
cada uno cubre un caso que el otro no:

- **SSE cubre "pestaña abierta ahora mismo"**: actualiza la UI al instante (campanita, contador
  de no leídas) sin que el usuario tenga que refrescar — pero no llega nada si cerró la pestaña.
- **Web Push cubre "pestaña/navegador cerrado"**: el Service Worker lo despierta el sistema
  operativo — pero exige permiso explícito del usuario y un opt-in (`/perfil`,
  `PushSubscriptionToggle`), no es automático como SSE.

Un profesional con `TekoApp-Web` abierto ve la notificación al instante por SSE; si la cerró y dio
permiso de push, la recibe igual por Web Push. Ninguno de los dos reemplaza al otro.

### Por qué FCM para mobile (no un servicio propio)

Sin cambios respecto a la decisión original: `firebase-admin` ya estaba en `package.json`, FCM es
el estándar de facto para push en Flutter (`firebase_messaging`), evita mantener infraestructura
propia de push (APNs + FCM por separado).

### Por qué un solo backend de notificaciones para los 3 canales (in-app/SSE, Web Push, FCM)

El modelo de dominio (`NotificationDocument` en Mongo: `userId`, `type`, `title`, `message`,
`channels[]`, `status`) ya estaba pensado para multi-canal — el job de Bull
(`NotificationsProcessor`) ahora sí despacha de verdad a cada canal declarado, incluyendo
`title`/`message`/`data` en el payload del job (antes solo viajaban `notificationId`/`userId`/
`type`/`channels`, insuficiente para armar el payload real de push).

## Endpoints nuevos (todos JWT-only, mismo guard que el resto de `/notifications`)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/notifications/stream` | GET (SSE) | Stream en tiempo real del usuario autenticado |
| `/notifications/push/vapid-public-key` | GET | Clave pública VAPID (no secreta) |
| `/notifications/push-subscriptions` | POST | Registrar/actualizar suscripción Web Push |
| `/notifications/push-subscriptions/:referenceId` | DELETE | Dar de baja una suscripción |
| `/notifications/fcm-tokens` | POST | Registrar/actualizar token FCM |
| `/notifications/fcm-tokens/:referenceId` | DELETE | Dar de baja un token |

## Nota sobre autenticación de SSE

`EventSource` (API del browser) no puede mandar headers custom, así que no puede mandar
`Authorization: Bearer`. `TekoApp-Web` no lo necesita — su proxy BFF (`/api/backend/[...path]`)
reenvía la cookie `accessToken` y el proxy la traduce a `Authorization: Bearer` antes de pegarle al
backend real, igual que cualquier otro endpoint. Para un cliente que le pegue directo al backend
(sin BFF — potencialmente `TekoApp-Frontend-Mobile` en el futuro, o pruebas manuales), se agregó un
fallback en `modules/auth/strategies/jwt.strategy.ts`: acepta el JWT también como query param
`?access_token=...` (patrón estándar de `passport-jwt` para SSE/websockets), sin tocar el
comportamiento del header Bearer para el resto de la API.

## Frontend Web — implementado

- `public/sw.js`: Service Worker, maneja `push` (muestra la notificación nativa) y
  `notificationclick` (enfoca/abre la app — sin deep link a una pantalla de detalle todavía,
  porque no existe esa pantalla en `TekoApp-Web` hoy).
- `src/lib/web-push.ts`: conversión base64url → `Uint8Array` para `applicationServerKey`.
- `src/features/notifications/components/push-subscription-toggle.tsx`: opt-in en `/perfil`
  (junto a los datos de perfil ya existentes) — pide permiso, registra el Service Worker, suscribe,
  persiste el `referenceId` en `localStorage` para poder dar de baja después.
- `src/features/notifications/components/notification-bell.tsx`: campanita en el `Topbar` de los
  3 layouts (admin/client/pro) — contador de no leídas + últimas notificaciones + "marcar todas
  como leídas", todo actualizado en vivo vía `useNotificationsStream` (SSE).

## Mobile (Flutter, cuando arranque) — sin cambios respecto al backlog original

1. Paquete `firebase_messaging` + configuración de Firebase (`google-services.json`/
   `GoogleService-Info.plist`).
2. Al loguear (o al iniciar la app con sesión activa), pedir el token FCM y mandarlo a
   `POST /notifications/fcm-tokens` (endpoint ya implementado y probado en este backend).
3. Manejar notificación recibida con la app en foreground/background/cerrada (3 callbacks
   distintos en `firebase_messaging` — revisar su doc oficial, no asumir que uno solo cubre los 3).

Ver `TekoApp-Frontend-Mobile/openspec/changes/0005-realtime-and-push.md` — el bloqueo "depende del
backend" que documentaba esa fase ya no aplica para la parte de push (el backend está listo);
segue bloqueado solo por la falta de cliente Flutter, no de infraestructura.

## Verificación pendiente (no se pudo completar en esta sesión)

Postgres quedó inalcanzable en el entorno local durante la verificación final (`Can't reach
database server at localhost:5432` pese a que el servicio Windows figura "Running" — mismo
problema de entorno ya reportado antes en este proyecto, requiere reinicio con permisos de
administrador). Se verificó todo lo que no depende de una DB real y funcionando:

- Backend: 1044/1044 tests unitarios (mocks), lint y build limpios.
- Frontend: 135/135 tests unitarios (MSW), lint, `check:types` y build limpios.
- Boot real del backend (`node dist/main.js`) contra Redis real (Docker) — confirma que
  `FcmProviderService` degrada correctamente con las credenciales placeholder de `.env`
  (`WARN: No se pudo inicializar Firebase Admin ... FCM deshabilitado`), sin tumbar el arranque.

Lo que falta verificar de punta a punta una vez Postgres esté disponible: login real, la
campanita SSE actualizándose en vivo al crear una notificación desde otra pestaña/sesión, y el
toggle de Web Push suscribiendo/enviando contra un service worker real en Chrome.
