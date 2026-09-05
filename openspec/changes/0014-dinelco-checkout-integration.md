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

## Contrato real de la pasarela

Relevado 2026-09-04 leyendo la implementación productiva de referencia que indicó José:
`c:/workspace/portal-comercios-backend/src/modules/payments-providers/` (servicio, helper,
interfaces, controller de callback y config). No se pudo leer la doc oficial —
`dev-sgwf-01.bepsa.com.py` (`190.128.216.70`) no responde fuera de la red corporativa — así que
**todo lo de abajo sale del código real de un cliente que ya está integrado**, no de la doc.

### Autenticación saliente (nosotros → Checkout)

Tres headers, sin firma de payload:

```
Content-Type:  application/json
Authorization: Bearer <CHECKOUT_API_TOKEN>
x-merchant:    base64( JSON.stringify({ riCode: <merchantCode>, sucCode: <branchCode> }) )
```

Configuración: solo 3 variables (`config-loader.ts:53-57` + `config-schema.ts:28-30` de
portal-comercios):

| Env var | Uso |
|---|---|
| `CHECKOUT_API_SERVER_URL` | Base URL de la API |
| `CHECKOUT_API_TOKEN` | El bearer de comercio |
| `CHECKOUT_DEFAULT_CALLBACK_URL` | URL por defecto donde Checkout notifica el resultado |

### Crear link de pago

`POST {CHECKOUT_API_SERVER_URL}/payment-link`

Request (`ICheckoutDLinkGenerateRequest`):

| Campo | Tipo | Nota |
|---|---|---|
| `amount` | `number` | Moneda PYG (el enum `IDLinkCurrency` **solo tiene `PYG`**) |
| `currency` | `'PYG'` | |
| `description?` | `string` | |
| `expirationDate?` | `string` | |
| `maxPayments?` | `number` | Cuántos pagos admite el link |
| `permalink?` | `boolean` | Link reutilizable vs. de un solo uso |
| `customer?` | `{ customerId?, name, lastname, email, phone }` | |
| `lineItems?` | `[{ name, price, quantity, description?, img? }]` | |
| `metadata?` | `Record<string, string>` | **Acá se ata la orden con nuestro dominio** |
| `callbackUrl?` | `string \| null` | **Se manda por link, no es global** |

Response (`ICheckoutDLinkGenerateResponse`): `{ url, shortlinkId }`.

`metadata` es el mecanismo de correlación: portal-comercios mete ahí `userId`, `merchantCode`,
`branchCode`, `ruc`, datos del cliente. **Para TekoApp ahí va `Payments.referenceId`.**

### Cancelar link

`DELETE {CHECKOUT_API_SERVER_URL}/payment-link?shortlink=<shortlinkId>`

Detalle de comportamiento que vale la pena copiar: un `400` con
`message: 'Payment link is already canceled'` se trata como éxito idempotente, no como error
(`payment-checkout-provider.service.ts:100-130`) — evita que una cancelación repetida rompa la
sincronización con la base.

### Callback entrante (Checkout → nosotros)

`POST <callbackUrl>` con body (`CheckoutCallbackRequestDTO`):

```jsonc
{
  "clientReferenceId": "...",
  "paymentLink": {
    "shortlinkId": "3ZS7hGu9",
    "status": "ACTIVE|INACTIVE|CANCELED|EXPIRED|COMPLETED"
  },
  "payment": {
    "id": 3558,                    // id de la transacción en la pasarela
    "status": "APPROVED|REJECTED",
    "operationNumber": "673801992137",
    "authorizationCode": "..."
  }
}
```

## ⚠️ El punto crítico: la pasarela no ofrece verificación de autenticidad

**Esto es lo más importante de esta spec.** En la implementación de referencia:

- `POST payments/checkout/callback` (`checkout-payment.controller.ts:42-49`) **no tiene ningún
  `@UseGuards`** y el controller no aplica guard a nivel de clase.
- No hay `APP_GUARD` global en ese repo, ni firma HMAC, ni token compartido, ni allowlist de IPs
  en `src/` (verificado por grep).
- La config del checkout tiene **3 variables y ninguna es un secreto de callback** — lo que sugiere
  fuertemente que **la pasarela simplemente no provee un mecanismo de firma**.
- El handler toma `paymentLink.shortlinkId` y `payment.status` del body y avanza el estado de la
  orden de venta.

O sea: no es que se les haya olvidado verificar la firma — **es que no hay firma que verificar**.
Eso cambia el diseño: no podemos copiar "verificá la firma" porque no existe. Hay que compensar por
otro lado.

### Mitigación propuesta para TekoApp (defensa en capas)

Ninguna de las tres alcanza sola; van juntas:

1. **URL de callback con secreto por link.** `callbackUrl` se manda **por link** (no es fija), así
   que podemos generar una ruta con un token de alta entropía por pago:
   `POST /payments/dinelco/callback/:callbackToken`, con `callbackToken` = 256 bits aleatorios
   guardados junto al `Payments`. Un atacante que conoce el `shortlinkId` (que viaja en la URL que
   ve el cliente, o sea que **no es secreto**) igual no puede adivinar el token. Esto convierte una
   URL pública en un canal autenticado por capacidad, sin depender de que la pasarela firme nada.
2. **Nunca confiar en el `status` del body: reconsultar.** Al recibir el callback, consultar el
   estado autoritativo del pago contra la API de Checkout antes de mover plata. El callback pasa a
   ser una *señal de "revisá esto"*, no la fuente de verdad. (Pendiente de confirmar: si Checkout
   expone un `GET /payment-link/:shortlinkId` o equivalente — no aparece en el código de
   referencia, que solo usa `POST` y `DELETE`.)
3. **Idempotencia real.** Usar el patrón `updateMany` condicional que ya es convención del repo, de
   modo que el mismo callback recibido N veces produzca un solo efecto — y loguear el
   `payment.id`/`operationNumber` de la pasarela para poder auditar duplicados.

### Datos que igual faltan de la doc oficial

- [ ] Formato exacto de `amount` para PYG: ¿entero de guaraníes (lo probable, el guaraní no tiene
      decimales) o algún escalado? Hoy `Payments.amount` es `Decimal` en Prisma.
- [ ] ¿Existe endpoint de **consulta de estado** de un link/pago? Es el que necesita la mitigación 2.
- [ ] ¿Existe endpoint de **reembolso**? El código de referencia solo cancela links (que no es lo
      mismo que reembolsar un pago ya aprobado). TekoApp ya tiene reembolsos parciales acumulativos
      implementados del lado nuestro y habría que atarlos a algo real.
- [ ] ¿Hay **split payment / transferencia a terceros**? Define si el payout al profesional se
      apoya en la pasarela o necesita un proceso propio de liquidación.
- [ ] `riCode`/`sucCode`: TekoApp es el comercio único, o ¿cada profesional se onboardea como
      sub-comercio? Cambia el modelo de datos y el flujo de alta.
- [ ] URLs y credenciales de los ambientes dev/staging/producción.

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
**no** puede quedar abierto (ese fue exactamente el bug de la Fase A). Como la pasarela no ofrece
firma (ver §⚠️), la autenticidad se construye del lado nuestro:

1. **Controller propio** (`dinelco-callback.controller.ts`), separado del controller de pagos que
   lleva el guard de sesión a nivel de clase — así el guard no se hereda ni se pierde por accidente,
   que es exactamente cómo nació el bug anterior.
2. **Ruta con secreto por pago**: `POST /payments/dinelco/callback/:callbackToken`. El token se
   genera al crear el link (256 bits), se persiste junto al `Payments` y se manda a Checkout en el
   campo `callbackUrl` de la request de creación. Un `callbackToken` inválido o desconocido devuelve
   404 **sin revelar si el pago existe** y sin tocar la base.
3. **Reconsulta antes de mover estado**: el `payment.status` del body es una señal, no la verdad.
   Confirmar contra la API de Checkout antes de marcar un pago como pagado (pendiente confirmar que
   exista endpoint de consulta — ver datos faltantes).
4. **Idempotencia** con el patrón `updateMany` condicional que ya es convención del repo (ver
   `.claude/rules/typescript.md`): el mismo callback N veces produce un solo efecto. Persistir el
   `payment.id` y `operationNumber` de la pasarela para poder auditar reintentos.
5. **Tests obligatorios**: token válido aplica el efecto; token inválido devuelve 404 **y no escribe
   en la base**; callback repetido no duplica el efecto; `status: REJECTED` no marca como pagado.

### Cancelación: copiar el manejo idempotente de la referencia

`DELETE /payment-link?shortlink=<id>` devuelve `400 { message: 'Payment link is already canceled' }`
si ya estaba cancelado. La implementación de referencia lo trata como éxito y sincroniza la base
igual (`payment-checkout-provider.service.ts:100-130`). Copiar ese comportamiento — sin él, un
reintento de cancelación deja la base desincronizada con la pasarela.

### Payout al profesional (dependencia, no parte de esta fase)

`professionalNetAmount` hoy se expone en `payment-detail.response.dto.ts:95` y nunca se escribe.
Cerrar el ciclo de negocio (cobrar al cliente → pagar al profesional) es una fase aparte, pero
**esta integración debería definir ya** si Dinelco ofrece split payment / transferencia a terceros,
porque eso cambia el diseño: si lo ofrece, el payout se apoya en la pasarela; si no, hace falta un
proceso propio de liquidación y transferencia bancaria.

## Tareas

- [ ] 0 — Cerrar los datos faltantes con la doc oficial (formato de monto, consulta de estado,
      reembolso, split payment, modelo de comercio, ambientes).
- [ ] 1 — Módulo `src/modules/dinelco/` con `DinelcoCheckoutService` (crear link, cancelar,
      consultar estado) sobre `HttpService` + `firstValueFrom` + `handleHttpErrors`, siguiendo el
      patrón de `payment-checkout-provider.service.ts` de portal-comercios. Con tests.
- [ ] 2 — Config: bloque `dinelco` (`url`, `token`, y los códigos de comercio) validado con Joi.
      **Remover el bloque `stripe`** y la dependencia `stripe` de `package.json` — hoy obliga a
      definir un `STRIPE_WEBHOOK_SECRET` que nadie consume.
- [ ] 3 — Schema: `Payments` necesita `callbackToken` (único, indexado) y el `shortlinkId` de la
      pasarela como referencia externa. Migración + `fn_attach_audit_triggers()`.
- [ ] 4 — `PaymentApiService.createPayment` genera el `callbackToken`, arma la `callbackUrl` con él,
      llama a Dinelco y persiste `shortlinkId` + la URL de pago que devuelve la pasarela.
- [ ] 5 — Controller de callback dedicado con las 5 defensas de arriba + tests (token válido /
      token inválido / repetido / `REJECTED`).
- [ ] 6 — Cancelación con el manejo idempotente del `400 already canceled`.
- [ ] 7 — Reembolso contra la pasarela, atado al flujo de reembolsos parciales ya existente
      (depende de que exista endpoint — ver datos faltantes).
- [ ] 8 — Actualizar Web y Mobile: el flujo de pago pasa a tener un paso de redirección al link de
      Checkout que hoy no existe en ninguno de los dos clientes.
- [ ] 9 — Checkpoint de negocio real: un cobro de prueba de punta a punta contra el ambiente de
      desarrollo de Dinelco.

## Checkpoint de salida

- [ ] Un cobro real de prueba pasa por Dinelco y deja el `Payments` en `COMPLETED` por callback
      recibido en una URL con token válido, no por una llamada interna.
- [ ] Un callback a un `callbackToken` inexistente devuelve 404 y no modifica ningún registro.
- [ ] El mismo callback recibido dos veces produce un solo efecto.
- [ ] Una cancelación repetida no desincroniza la base con la pasarela.
- [ ] No queda ninguna referencia a Stripe en `package.json`, config ni código.
