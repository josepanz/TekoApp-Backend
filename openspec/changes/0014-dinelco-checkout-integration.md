# Fase 0014 — Integración de pasarela de pago: Dinelco Checkout (BEPSA)

Origen: auditoría de plataforma 2026-09-04 (`openspec/specs/platform-audit-2026-09.md` §2.1).
Decisión de José 2026-09-04: **la pasarela real es Dinelco Checkout de BEPSA**, no Stripe.
Documentación de integración: `https://dev-sgwf-01.bepsa.com.py/dinelco-checkout/docs/es/`
(host interno — no accesible desde el entorno de desarrollo de esta sesión, ver §Bloqueantes).

## Contexto: de qué partimos

Contra lo que sugería el `package.json`, **Stripe nunca estuvo integrado**. Verificado:
`stripe@^14.0.0` está declarado como dependencia pero **no se importa en ningún archivo de `src/`
ni de `test/`**. Todo el flujo de pago es interno/simulado: `createPayment` genera su propio
`transactionId` y `PaymentDbService` mueve los estados; no hay ninguna llamada saliente a una
pasarela.

Lo que sí existía era un `POST /payments/webhooks/:provider` con forma de webhook de Stripe, que
**se removió en la Fase A de la auditoría** por ser un agujero de autorización vivo (tomaba un
`externalId` arbitrario del body y flipeaba el estado del pago, gateado solo por `JwtAuthGuard`,
sin verificar firma). No se re-implementó con Stripe porque el contrato de callback de Dinelco es
distinto y habría sido trabajo tirado.

Estado actual del dominio de pagos, entonces:

| Pieza | Estado |
|---|---|
| Modelos `Payments`/`PaymentTransaction`-como-campo, estados, reembolsos | Implementados y TOCTOU-safe |
| Cálculo de comisión (`fee-calculator.service.ts`) e IVA (`TaxService`) | Implementados |
| Propinas (`Tips`) | Implementadas |
| Llamada real a una pasarela | **No existe** |
| Webhook / callback de resultado | **No existe** (removido) |
| Payout al profesional | **No existe** — `professionalNetAmount` se expone y nunca se escribe |

## Objetivo

Reemplazar el pago simulado por un cobro real vía Dinelco Checkout, con confirmación asíncrona
verificable, sin romper el flujo de estados ni los cálculos de comisión/IVA/propina que ya
funcionan.

## Bloqueantes antes de escribir código

La documentación de Dinelco vive en un host interno de BEPSA (`dev-sgwf-01.bepsa.com.py`,
`190.128.216.70`) que no responde fuera de la red corporativa. Para completar esta spec hacen falta
estos datos concretos:

- [ ] **Autenticación de comercio**: ¿qué credenciales usa (public key + private key, token de
      comercio, certificado)? ¿Van por header, por body, o firmadas?
- [ ] **Endpoint de creación de checkout**: path, método, campos de request y de response. En
      particular: cómo se identifica la orden del lado nuestro (`external_reference`/`order_id`) —
      ese es el campo que va a atar el pago de Dinelco con nuestro `Payments.referenceId`.
- [ ] **Formato de monto y moneda**: ¿PYG en enteros (sin decimales, como corresponde al guaraní) o
      en centavos? Esto importa: hoy `Payments.amount` es `Decimal` en Prisma.
- [ ] **Cómo vuelve el resultado**: ¿callback server-to-server (webhook), redirect del navegador con
      parámetros, consulta de estado por polling, o una combinación?
- [ ] **Verificación de autenticidad del callback**: ¿firma HMAC sobre el body? ¿token compartido?
      ¿allowlist de IPs? **Este es el dato más importante de todos** — es exactamente lo que faltaba
      en el webhook viejo y lo que causó el hallazgo crítico de la auditoría.
- [ ] **Reembolso/anulación**: ¿hay endpoint? ¿parcial o total? Hoy tenemos reembolsos parciales
      acumulativos implementados del lado nuestro y habría que atarlos.
- [ ] **Ambientes**: URLs de dev/staging/producción y si hay credenciales de prueba.

## Diseño propuesto (a confirmar contra la doc real)

### Módulo nuevo `src/modules/dinelco/`

Siguiendo la convención del repo (`api/*` orquesta, `modules/*` encapsula la integración):

```
src/modules/dinelco/
├── dinelco.module.ts
├── interfaces/dinelco.interface.ts     # contratos de request/response de la pasarela
├── types/dinelco.type.ts
└── services/
    ├── dinelco-checkout.service.ts     # crear checkout, consultar estado, reembolsar
    └── dinelco-signature.service.ts    # verificación de autenticidad del callback
```

`PaymentApiService` sigue siendo el orquestador y nunca habla HTTP directo con Dinelco: llama a
`DinelcoCheckoutService`, igual que hoy llama a `PaymentDbService`.

### Configuración

Agregar a `config-loader.ts`/`config-schema.ts`/`app.config.ts` un bloque `dinelco` con las
credenciales y la URL base por ambiente, con validación Joi `required` (mismo patrón que el bloque
`stripe` actual). **Y quitar el bloque `stripe`** en el mismo cambio — hoy exige un
`STRIPE_WEBHOOK_SECRET` que nadie consume, lo que obliga a definir una variable inútil en cada
ambiente.

### Callback: la parte que la auditoría exige hacer bien

El endpoint de callback **no** va bajo `JwtAuthGuard` (la pasarela no tiene sesión de usuario) y
**no** puede quedar abierto (ese fue el bug). El diseño correcto:

1. Ruta dedicada en un controller propio (`dinelco-callback.controller.ts`), fuera del controller
   de pagos que lleva el guard de sesión a nivel de clase — así el guard no se hereda por accidente,
   que es exactamente cómo nació el bug anterior.
2. Verificación de autenticidad **antes de tocar la base**, con el mecanismo que exija Dinelco. Si
   es firma HMAC sobre el cuerpo crudo, hace falta `NestFactory.create(AppModule, { rawBody: true })`
   y leer `req.rawBody` — el parser JSON global destruye el buffer que la firma cubre.
3. Idempotencia: la pasarela puede reintentar el mismo evento. La transición de estado debe usar el
   patrón `updateMany` condicional que ya es convención del repo (ver
   `.claude/rules/typescript.md`), de modo que un evento repetido no vuelva a aplicar el efecto.
4. Tests obligatorios: firma válida aplica el efecto; firma inválida devuelve 4xx **y no escribe en
   la base**; evento repetido no duplica el efecto.

### Payout al profesional (dependencia, no parte de esta fase)

`professionalNetAmount` hoy se expone en `payment-detail.response.dto.ts:95` y nunca se escribe.
Cerrar el ciclo de negocio (cobrar al cliente → pagar al profesional) es una fase aparte, pero
**esta integración debería definir ya** si Dinelco ofrece split payment / transferencia a terceros,
porque eso cambia el diseño: si lo ofrece, el payout se apoya en la pasarela; si no, hace falta un
proceso propio de liquidación y transferencia bancaria.

## Tareas

- [ ] 0 — Completar los bloqueantes de arriba con la doc real de Dinelco.
- [ ] 1 — Módulo `dinelco` con el servicio de checkout y el de verificación de firma + tests.
- [ ] 2 — Config: bloque `dinelco` validado con Joi; **remover el bloque `stripe`** y la dependencia
      `stripe` de `package.json` (deuda registrada en la auditoría).
- [ ] 3 — `PaymentApiService.createPayment` llama a Dinelco en vez de simular; `Payments` guarda el
      identificador externo que devuelva la pasarela.
- [ ] 4 — Controller de callback dedicado, con verificación de autenticidad e idempotencia + tests
      (firma válida / firma forjada / evento repetido).
- [ ] 5 — Reembolso contra la pasarela, atado al flujo de reembolsos parciales ya existente.
- [ ] 6 — Actualizar Web y Mobile: el flujo de pago pasa a tener un paso de redirección/checkout
      externo que hoy no existe en ninguno de los dos clientes.
- [ ] 7 — Checkpoint de negocio real: un cobro de prueba de punta a punta contra el ambiente de
      desarrollo de Dinelco.

## Checkpoint de salida

- [ ] Un cobro real de prueba pasa por Dinelco y deja el `Payments` en `COMPLETED` por callback
      verificado, no por una llamada interna.
- [ ] Un callback con firma forjada se rechaza y no modifica ningún registro.
- [ ] El mismo callback recibido dos veces produce un solo efecto.
- [ ] No queda ninguna referencia a Stripe en `package.json`, config ni código.
