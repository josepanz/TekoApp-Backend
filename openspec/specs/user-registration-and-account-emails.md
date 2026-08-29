# Spec: Registro de usuarios y emails transaccionales de cuenta

Ver también: `TekoApp-Frontend-Web/openspec/specs/user-registration-and-account-recovery.md`,
`TekoApp-Frontend-Mobile/openspec/specs/user-registration-and-account-recovery.md`.

## Objetivo

Cerrar la brecha real encontrada 2026-08-25: el backend YA tiene la mayor parte del backend de
registro/recuperación de cuenta implementado (`POST /onboarding`, `PUT /auth/forgot-password`,
`GET /auth/user-verify`, etc.), pero **ningún cliente (Web ni Mobile) tiene pantallas que lo
consuman** — hoy no existe ninguna forma de que un usuario nuevo se registre, verifique su email,
recupere su contraseña, o reciba un correo de bienvenida/comprobante desde ninguno de los 2
frontends. Esta spec (a) documenta el contrato real ya existente para que Web/Mobile lo consuman
sin adivinar, y (b) agrega los 3 gaps reales de backend: email de bienvenida, comprobantes de pago
por correo, y notificaciones de eventos de servicio por correo.

## Alcance

**Incluye**:
- Documentar el contrato real de `POST /onboarding`, `PUT /auth/forgot-password`,
  `POST /auth/create-password`, `GET /auth/user-verify`, `GET /auth/verification-status`, y los 3
  endpoints `POST /auth/email/send-*` — todos YA IMPLEMENTADOS, sin cambios de contrato en esta
  fase salvo lo listado en "Gaps a cerrar".
- `EmailTypeEnum.WELCOME` — email de bienvenida nuevo, disparado tras verificación exitosa (no en
  el registro mismo — ver "Riesgos/límites").
- Cablear `EmailTypeEnum.PAYMENT_RECEIPT` (ya existe en el enum, sin ningún caller hoy —
  confirmado grepeando `sendEmailByType` en todo `src/`) — disparar tras un pago exitoso.
- `EmailTypeEnum.SERVICE_STATUS_UPDATE` (nuevo) — aviso por correo en los mismos eventos que ya
  disparan notificación push/in-app (`modules/notifications`): servicio aceptado, servicio
  iniciado, servicio completado, servicio cancelado.

**No incluye**: ningún cambio a `POST /onboarding`/`PUT /auth/forgot-password`/etc. (ya
funcionan); no incluye un proveedor de email nuevo (sigue siendo nodemailer, ya configurado); no
incluye SMS.

## Contrato existente (documentado, no reimplementado)

| Endpoint | Guard | DTO / query | Qué hace |
|---|---|---|---|
| `POST /onboarding` | `BasicAuthGuard` (client secret, pre-login) | `OnboardingUserRequestDTO { firstName, lastName, email, phoneNumber, password, confirmPassword, acceptTerms }` — `password`/`confirmPassword` cifrados RSA-OAEP, mismo mecanismo que login | Crea `Users` en `PENDING_VERIFICATION`, credenciales, dispara email `VERIFICATION` |
| `POST /auth/email/send-verification` | `BasicAuthGuard` + `UserByEmailLoaderGuard` | `EmailSendRequestDTO { email }` | Reenvía el email de verificación |
| `GET /auth/user-verify` | `JwtAuthGuard` (Bearer) | — (usuario resuelto del JWT) | Confirma el email del usuario autenticado — **ver riesgo explícito abajo, requiere sesión activa** |
| `GET /auth/verification-status` | `BasicAuthGuard` + `UserByEmailLoaderGuard` | `VerificationStatusQueryDTO` (query, por email) | Consulta si un email ya está verificado, sin necesitar sesión |
| `POST /auth/email/send-password-reset` | `BasicAuthGuard` + `UserByEmailLoaderGuard` | `EmailSendRequestDTO { email }` | Dispara el email de "olvidé mi contraseña" |
| `PUT /auth/forgot-password` | `BasicAuthGuard` (pre-login) | `ForgotUserPasswordDTO { token, encryptedNewPassword, encryptedConfirmPassword }` | Aplica la nueva contraseña — `token` es el JWT temporal del email, `encrypted*` cifrados RSA-OAEP |
| `POST /auth/create-password` | `BasicAuthGuard` (pre-login) | `CreatePasswordDTO` | Flujo de invitación (usuario pre-creado por staff, crea su propia contraseña) |
| `POST /auth/email/send-create-password` | `BasicAuthGuard` + `UserByEmailLoaderGuard` | `EmailSendRequestDTO { email }` | Dispara el email de invitación/crear contraseña |

**Contrato de links que el email templates ya asumen** (ver `modules/email` — confirmar contra el
código real de los templates, no asumido acá): el email de verificación linkea a una ruta de
Web `/auth/verify-email/confirm?email=...&token=...`; el de recuperación linkea a
`/auth/reset-password?token=...&email=...`. **Estas 2 rutas son exactamente las que
`TekoApp-Frontend-Web` debe implementar** (ver su spec) — no inventar nombres de ruta distintos.

## Gaps a cerrar (Tareas de esta fase)

1. **`EmailTypeEnum.WELCOME`** — nuevo template + trigger. Se dispara en el mismo punto donde el
   `UserStatus` pasa de `PENDING_VERIFICATION` a `ACTIVE` (dentro de `userVerify()` en
   `AuthApiService`, después de persistir el cambio de estado) — nunca en el registro mismo, para
   no darle la bienvenida a alguien que nunca confirmó ser dueño de ese email.
2. **`EmailTypeEnum.PAYMENT_RECEIPT` cableado** — el enum existe pero no tiene ningún caller hoy.
   Disparar desde el punto donde un pago pasa a estado exitoso (`modules/payments`, ver el mismo
   hook que ya usa la notificación push `payment_received`) — incluir en el template: monto,
   servicio, fecha, profesional/cliente contraparte.
3. **`EmailTypeEnum.SERVICE_STATUS_UPDATE`** (nuevo) — email en los mismos eventos que ya generan
   notificación push/in-app hoy (`service_accepted`, `service_rejected`, `service_completed` —
   ver `NotificationTypeEnum` en `modules/notifications`). Reusar el mismo punto de disparo que la
   notificación push existente, no duplicar la lógica de "cuándo" — solo agregar el canal email al
   lado del canal push ya existente para esos 3 eventos puntuales.

## Qué es parametrizable/configurable

- Qué eventos de servicio disparan email (lista de `NotificationTypeEnum` que además de push
  dispara email) — vive como config en `core/config`, no hardcodeado disperso en `services.service.ts`.
- Los 3 templates nuevos/cableados van al mismo mecanismo de templates ya usado por
  `VERIFICATION`/`FORGOT_PASSWORD`/`CREATE_PASSWORD` — no se introduce un motor de templates
  nuevo.

## Casos de error

- `PAYMENT_RECEIPT`/`SERVICE_STATUS_UPDATE`/`WELCOME` fallando al enviar (SMTP caído, etc.) nunca
  debe hacer fallar la operación de negocio que lo dispara (pago exitoso, cambio de estado de
  servicio, verificación de email) — mismo criterio best-effort que ya usa el resto de
  `modules/email` (confirmar el manejo de errores actual antes de replicarlo, no asumido).

## Fuera de alcance de esta spec

- Cambiar el contrato de `POST /onboarding`/`PUT /auth/forgot-password`/`POST /auth/create-password`
  (ya funcionan, se documentan tal cual).
- SMS, cualquier proveedor de email nuevo, preferencias de usuario para desactivar estos emails
  (backlog futuro si se pide).

## Riesgos / límites explícitos

- **`GET /auth/user-verify` requiere `JwtAuthGuard` (sesión activa)** — a diferencia del patrón
  típico de "click en un link de email sin estar logueado". Esto significa que si un usuario se
  registra, cierra la app/navegador, y clickea el link de verificación días después sin sesión
  activa, el endpoint devuelve `401` en vez de verificar. **Confirmar contra el equipo de backend
  (o releer `AuthApiService.userVerify`/`onboarding()` completo) si el registro deja una sesión
  persistida a propósito para este flujo, antes de que Web/Mobile implementen la pantalla de
  confirmación** — no asumido en esta spec, marcado explícitamente como pendiente de verificar en
  la fase de implementación.
- El nombre de ruta emailado (`/auth/verify-email/confirm`, `/auth/reset-password`) vive hoy
  dentro de los templates de `modules/email` (no en esta spec) — verificar que coincida
  exactamente con lo que implementa `TekoApp-Frontend-Web` al llegar a esa fase, un desalineamiento
  ahí rompe el link del email en silencio (sin error visible hasta que un usuario real lo clickea).
