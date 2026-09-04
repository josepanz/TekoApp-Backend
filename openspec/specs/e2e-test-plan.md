# Spec: Plan de pruebas E2E de plataforma, por dependencia (menor a mayor)

Web: `TekoApp-Frontend-Web/openspec/specs/e2e-test-plan.md`.
Mobile: `TekoApp-Frontend-Mobile/openspec/specs/e2e-test-plan.md`.

Pedido de José 2026-09-01: pruebas e2e sobre TODAS las funcionalidades de la plataforma (no solo
lo nuevo de onboarding-profesional), ordenadas de menor a mayor dependencia, para ir puliendo la
demo de Vercel/Render/Supabase fase por fase. Este documento define el orden y el alcance por
tier; no es una implementación — es el mapa para ir escribiendo/auditando specs `.e2e-spec.ts`
reales, tier por tier, sin saltarse dependencias.

## Cómo usar este documento

- Cada tier depende de que el/los tier(es) anterior(es) ya tengan cobertura razonable — no tiene
  sentido escribir e2e de Tier 4 (marketplace) si Tier 1 (auth) todavía puede romperse en
  silencio.
- Antes de escribir un test nuevo, correr `pnpm run test:e2e` y confirmar qué specs ya existen
  hoy en la carpeta real del repo (verificarla, no asumir un path) — no duplicar cobertura ya
  presente, solo llenar los huecos reales de cada tier.
- Cada tier cierra con un checkpoint verificable — no pasar al siguiente tier sin cerrarlo.

## Tier 1 — Fundación (auth, sesión, guards)

Bloquea todo lo demás si está roto.

- [ ] `POST /onboarding` (registro): éxito, email duplicado (`USER_ALREADY_EXISTS`), password/
      confirmPassword que no matchean tras desencriptar.
- [ ] `POST /auth/nonce` + `POST /auth/login`: éxito, credenciales inválidas, usuario sin
      verificar (si aplica el estado).
- [ ] `GET /auth/scope`: refleja permisos/roles reales tras login.
- [ ] Refresh token: expira access token → refresh automático funciona → refresh inválido/expirado
      → 401 limpio, no loop.
- [ ] Basic Auth de cliente en endpoints pre-login (`/auth/nonce`, `/auth/login`, `/onboarding`):
      credencial de cliente inválida → 401, nunca deja pasar sin ella.
- [ ] Guards de permiso: un endpoint admin-only rechaza a un usuario sin el permiso (mismo
      criterio que el fix de la Fase 0 de `0012-professional-onboarding-and-portfolio.md` —
      agregar el caso de `verify`/`suspend` acá una vez implementado).

**Checkpoint Tier 1**: un usuario nuevo puede registrarse, loguearse, refrescar su sesión, y
ningún endpoint protegido es alcanzable sin el permiso correcto.

## Tier 2 — Catálogos / datos de referencia (depende solo de Tier 1)

- [ ] `Category` CRUD admin + listado público (activo+visible).
- [ ] `ServiceTypes` listado.
- [ ] `ProfessionalDocumentTypes` CRUD admin (país/categoría/obligatoriedad/vigencia).
- [ ] `TaxConfig`/`TipConfig`/`PlatformCommissionConfig`: resolución por país con fallback seguro
      cuando no hay fila cargada (ya documentado como comportamiento esperado — confirmar que hay
      un test que lo ejercite explícitamente).

**Checkpoint Tier 2**: los catálogos que alimentan el resto de la plataforma están completos y sus
defaults seguros están probados.

## Tier 3 — Identidad extendida (depende de Tier 1)

- [ ] Auto-postulación a profesional (`POST /professionals`): éxito, doble postulación
      (`USER_ALREADY_PROFESSIONAL`), categoría inválida.
- [ ] Aprobación/rechazo de profesional (`verify`/`suspend`, una vez con el guard de la Fase 0 de
      `0012-...md`): 403 sin permiso, éxito con permiso, efecto real sobre `status`.
- [ ] Documentos de compliance: subida, listado propio, cola de admin, aprobar/rechazar con motivo
      obligatorio, `requiredDocumentsVerified` se recalcula correctamente tras cada revisión y
      tras expiración.
- [ ] Portafolio de trabajos (una vez implementada la Fase 4 de `0012-...md`): subir, listar,
      reordenar, ocultar, borrar, visibilidad pública correcta (`isVisible: false` no aparece en
      el endpoint público).

**Checkpoint Tier 3**: un usuario nuevo puede convertirse en profesional aprobado de punta a
punta, con o sin portafolio, sin intervención manual en la base de datos.

## Tier 4 — Marketplace core (depende de Tier 3: necesita un profesional aprobado + un cliente)

- [ ] Ciclo de vida de `ServiceRequests`/`Services`: crear solicitud → profesional acepta/rechaza →
      transiciones de estado (`ACCEPTED`/`IN_PROGRESS`/`COMPLETED`/`CANCELLED`) → concurrencia
      (dos aceptaciones simultáneas del mismo request → solo una gana, la otra recibe 409).
- [ ] Presupuestos multi-opción: catálogo de materiales, armar opciones, cliente elige una,
      `finalAmount` se deriva correctamente cuando no hay tarifa por hora.
- [ ] Contratos desde presupuesto aceptado: máquina de estados de 5 pasos, firma secuencial,
      generación de PDF.

**Checkpoint Tier 4**: un servicio completo (solicitud → aceptación → presupuesto → contrato →
completado) corre de punta a punta sin intervención manual.

## Tier 5 — Dinero y confianza (depende de Tier 4: necesita un servicio completado/en curso)

- [ ] Pagos: métodos de pago (alta, default, baja del último método activo bloqueada
      correctamente), creación, reembolsos parciales consecutivos, `GET /payments/me` vs.
      `GET /payments` (autorización: dueño vs. admin).
- [ ] Propinas: `TipConfig` por país, alta de propina sobre un pago, los 2 modos ofrecidos
      (`PERCENTAGE`/`FREE`) — `FIXED` queda documentado como no cubierto (sin UI todavía).
- [ ] Calificaciones: alta, `isAnonymous` se respeta en toda respuesta que exponga el rating
      (incluido `GET /professionals/:id/reviews`, donde ya hubo un bug real de este tipo), KPIs
      (`GET /ratings/me/stats`, `GET /ratings/professional/:id/average`).

**Checkpoint Tier 5**: el dinero y la reputación de la plataforma tienen cobertura de los casos
felices Y de los casos de autorización/anonimato ya identificados como sensibles en auditorías
previas.

## Tier 6 — Cumplimiento y secundarios (puede correr en paralelo a partir de Tier 1)

- [ ] Consentimiento de datos/imágenes: aceptar, bloqueo de operación sin consentimiento activo,
      auditoría de consentimientos (filtros por país/usuario).
- [ ] Disclosure de contenido generado por IA.
- [ ] Bitácora de trabajo (`ServiceProgressEntries`) — con y sin fotos (gate de consentimiento
      condicional).
- [ ] Notificaciones push (Firebase) — trigger correcto en los 3 eventos ya documentados
      (`service_accepted`/`service_rejected`/`service_completed`).
- [ ] Emails transaccionales (bienvenida, comprobante de pago, aviso de cambio de estado) — ver
      `openspec/changes/0007-user-registration-and-account-emails.md`.

**Checkpoint Tier 6**: ningún flujo de cumplimiento/secundario puede saltearse silenciosamente
(falla de envío de email/push no revierte la operación de negocio, pero tampoco pasa inadvertida —
confirmar que hay logging/alerta, no solo un `catch` mudo).

## Fuera de alcance de este documento

- Tests de carga/performance — esto es solo corrección funcional e2e.
- Cobertura del 100% de combinaciones — igual que el criterio ya usado en Web/Mobile para
  Playwright/widget-e2e, se prioriza el flujo representativo de cada dominio, no cada variante.
