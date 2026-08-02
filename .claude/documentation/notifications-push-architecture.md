# Arquitectura de notificaciones push — decisión y estado (2026-08-02)

## Estado actual (confirmado leyendo el código, no supuesto)

- **No hay SSE** en ningún endpoint del backend.
- **No hay Web Push real.** El canal `push` en `NotificationsProcessor` (`api/notifications/processors/notifications.processor.ts`)
  es un `logger.log(...)` que simula "despachando a FCM" — nunca llama a Firebase de verdad.
- `firebase-admin` está en `package.json` y su config se lee en `app.config.ts`
  (`firebase.projectId`/`privateKey`/`clientEmail`), pero **`admin.messaging()` no se invoca en
  ningún archivo del repo** — es infraestructura preparada, nunca conectada.
- Lo único real hoy es **Socket.io** (`LocationsGateway`, `api/locations/gateway/`) para tracking
  de ubicación en vivo — no se usa para notificaciones.
- Las notificaciones hoy son **100% in-app**: se crean vía `POST /notifications`, se guardan en
  Mongo (`notifications-db`), el cliente las lista con `GET /notifications` — sin push, sin
  tiempo real, el usuario tiene que tener la pestaña/app abierta y refrescar para verlas.

## Decisión

**Web Push (VAPID) para `TekoApp-Web` + Firebase Cloud Messaging para `TekoApp-Mobile`**, sobre el
mismo backend de notificaciones (`api/notifications/`, `modules/notifications-db/`) que ya existe
— no se reemplaza la infraestructura in-app, se le agrega un canal de entrega real.

### Por qué Web Push (no SSE) para el navegador

- **SSE requiere la pestaña abierta** con una conexión HTTP viva — no llega nada si el usuario
  cerró el navegador o la pestaña. Web Push sí llega con el navegador cerrado (lo despierta el
  Service Worker).
- SSE es más simple de implementar (no hay claves VAPID, no hay Service Worker), pero no cumple el
  caso de uso real: un profesional necesita enterarse de una solicitud nueva aunque no tenga
  TekoApp-Web abierto en ese momento.
- Contra: Web Push exige un Service Worker registrado en el frontend y que el usuario acepte el
  permiso de notificaciones del navegador (Safari/iOS tiene soporte parcial/tardío — verificar
  matriz de compatibilidad real antes de asumir cobertura 100%).

### Por qué FCM para mobile (no un servicio propio)

- `firebase-admin` ya está en `package.json` — es completar wiring, no agregar una dependencia
  nueva.
- FCM es el estándar de facto para push en apps nativas/Flutter (`firebase_messaging` package),
  evita mantener infraestructura propia de push (APNs + FCM por separado) — FCM ya abstrae ambos.

### Por qué un solo backend de notificaciones para los 3 canales (in-app, web push, FCM)

El modelo de dominio (`NotificationDocument` en Mongo: `userId`, `type`, `title`, `message`,
`channels[]`, `status`) ya está pensado para multi-canal (`channels: string[]`, con `'in_app'`
como default) — no hace falta un sistema paralelo, hace falta que `NotificationsProcessor`
efectivamente despache a los canales que ya declara soportar.

## Lo que falta implementar (backlog, no implementado en esta sesión)

### Backend

1. **Modelo de suscripción push** (nueva colección Mongo o tabla Postgres —
   evaluar cuál: si se consulta siempre por `userId` y no se relaciona con SQL, Mongo es
   consistente con `notifications-db`; si se prefiere una relación FK real con `Users`, Postgres):
   - Web Push: `{ userId, endpoint, keys: { p256dh, auth }, createdAt }` (forma estándar de
     `PushSubscription.toJSON()` del navegador).
   - FCM: `{ userId, fcmToken, platform: 'ios'|'android', createdAt }`.
   - Un usuario puede tener múltiples suscripciones (varios dispositivos/navegadores) — no es
     1:1 con `Users`.
2. **Endpoints nuevos**:
   - `POST /notifications/push-subscriptions` (self-service, JWT-only como `PUT /auth/me`) —
     el frontend web registra la suscripción del Service Worker acá.
   - `POST /notifications/fcm-tokens` (self-service) — mobile registra su token FCM acá.
   - `DELETE` de ambos, para cuando el usuario desactiva notificaciones o cierra sesión.
3. **Claves VAPID**: generar un par (`web-push generate-vapid-keys`), guardar en env vars
   (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — un `mailto:` de contacto), nunca
   hardcodeadas. La pública se expone al frontend (no es secreta, el Service Worker la necesita
   para `pushManager.subscribe()`).
4. **Dependencia nueva**: paquete `web-push` (Node) para firmar y enviar el payload a cada
   `endpoint` suscripto.
5. **`NotificationsProcessor` real**: reemplazar el `logger.log` del canal `push` por:
   - Buscar las suscripciones Web Push + tokens FCM del `userId` de la notificación.
   - Enviar vía `web-push.sendNotification(subscription, payload, { vapidDetails })` a cada
     suscripción web.
   - Enviar vía `admin.messaging().send({ token, notification, data })` a cada token FCM.
   - Manejar suscripciones muertas: un envío que devuelve 404/410 significa que el endpoint ya no
     existe (usuario revocó el permiso, desinstaló la app) — borrar esa suscripción de la DB en
     vez de reintentar indefinidamente.

### Frontend Web

1. Service Worker (`public/sw.js` o vía `next-pwa`/similar) que escuche el evento `push` y muestre
   la notificación nativa del navegador (`self.registration.showNotification(...)`).
2. Flujo de opt-in: un botón/toggle (ej. en `/perfil`, junto a los datos que ya se agregaron en
   esta sesión) que pida permiso (`Notification.requestPermission()`), y si se acepta, registre la
   suscripción (`pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`)
   y la mande a `POST /notifications/push-subscriptions`.
3. Manejar el caso "el usuario nunca dio permiso" o "lo revocó" sin romper el resto de la app — las
   notificaciones in-app (`GET /notifications`, ya funcionando) siguen siendo el fallback universal.

### Mobile (Flutter, cuando arranque)

1. Paquete `firebase_messaging` + configuración de Firebase (`google-services.json`/
   `GoogleService-Info.plist`).
2. Al loguear (o al iniciar la app con sesión activa), pedir el token FCM
   (`FirebaseMessaging.instance.getToken()`) y mandarlo a `POST /notifications/fcm-tokens`.
3. Manejar notificación recibida con la app en foreground/background/cerrada (los 3 casos tienen
   callbacks distintos en `firebase_messaging` — revisar su doc oficial al implementar, no asumir
   que un solo handler cubre los 3).

## Checkpoints sugeridos para implementar esto (fuera de esta sesión)

1. Backend: modelo de suscripción + endpoints + claves VAPID generadas → verificar con Postman/
   Swagger que se puede crear/borrar una suscripción fake.
2. Backend: `NotificationsProcessor` enviando Web Push real → probar con una suscripción real
   creada desde Chrome DevTools (Application → Service Workers → Push).
3. Frontend Web: Service Worker + opt-in en `/perfil` → probar de punta a punta: crear un servicio
   → el profesional recibe la notificación del navegador con la pestaña cerrada.
4. FCM: wiring del token registration + envío desde `NotificationsProcessor` → probar con un
   token de un dispositivo/emulador real (no hay forma de probar FCM sin un cliente real).
5. Recién ahí: arrancar `TekoApp-Frontend-Mobile` sabiendo que el backend ya tiene el canal push
   probado extremo a extremo, en vez de descubrir problemas de push cuando ya hay UI de mobile
   construida encima.
