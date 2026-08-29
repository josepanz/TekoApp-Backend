# Fase 0007 — Registro de usuarios y emails transaccionales de cuenta

Spec de diseño, NO implementada todavía. Contrato completo:
`openspec/specs/user-registration-and-account-emails.md`.

## Antes de empezar

Leer `openspec/specs/user-registration-and-account-emails.md` completo — en particular la tabla de
contrato existente (ya implementado, no reinventar) y la sección "Riesgos/límites explícitos"
sobre `GET /auth/user-verify` requiriendo sesión activa. Releer `AuthApiService.userVerify()` y
`OnboardingApiService.onboarding()` completos antes de tocar nada — confirmar empíricamente si el
registro deja sesión activa para el flujo de verificación, en vez de asumir.

## Objetivo

Cerrar los 3 gaps reales de `modules/email` que bloquean a Web/Mobile de tener un flujo de cuenta
completo: bienvenida, comprobante de pago, aviso de cambio de estado de servicio por email.

## Tareas

- [ ] Confirmar (releyendo código real, no el enum) si `GET /auth/user-verify` funciona con el
      flujo real de "click en el link del email sin sesión activa" — documentar el hallazgo en
      `decisions.md` antes de seguir, ajustar el guard si hace falta (cambiar a un token de query
      en vez de `JwtAuthGuard`, si se confirma que rompe el flujo real).
- [ ] `EmailTypeEnum.WELCOME` + template + trigger en el punto donde `UserStatus` pasa a `ACTIVE`.
- [ ] Cablear `EmailTypeEnum.PAYMENT_RECEIPT` (ya existe, sin caller) al hook de pago exitoso de
      `modules/payments`.
- [ ] `EmailTypeEnum.SERVICE_STATUS_UPDATE` (nuevo) + trigger en los mismos 3 eventos que ya
      disparan push (`service_accepted`/`service_rejected`/`service_completed`).
- [ ] Config nueva en `core/config` para la lista de eventos que disparan email (no hardcodear).
- [ ] Claves i18n nuevas para los 3 templates (es/en).
- [ ] Tests unitarios (trigger correcto por evento, fallo de envío no revierte la operación de
      negocio).
- [ ] `pnpm run format` + `pnpm run lint --fix` en 0 warnings.

## Checkpoint de salida

- [ ] Un usuario que verifica su email recibe el correo de bienvenida (y no antes de verificar).
- [ ] Un pago exitoso genera el email de comprobante con los datos correctos del servicio.
- [ ] Aceptar/completar/rechazar un servicio dispara el email de aviso al mismo tiempo que la
      notificación push ya existente.
- [ ] El hallazgo sobre `GET /auth/user-verify` está documentado en `decisions.md`, con el ajuste
      aplicado si hizo falta.
