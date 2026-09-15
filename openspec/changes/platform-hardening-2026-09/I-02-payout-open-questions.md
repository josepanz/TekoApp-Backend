# I-02 · Payout a profesionales — bloqueado por falta de proveedor, NO por falta de diseño

Origen: `openspec/changes/platform-hardening-2026-09/WORKPLAN.md` §5, I-02.

## ACTUALIZACIÓN 2026-09-07 — la pregunta 1 quedó respondida, y la respuesta es "no"

**José confirmó, con conocimiento directo de la red: Dinelco/BEPSA NO hace envíos a terceros.**
Solo transfiere hacia **comercios adheridos a su propia red**. Un profesional de TekoApp no es un
comercio adherido y no hay forma de convertirlo en uno como parte del alta en la plataforma.

Consecuencias inmediatas, para que nadie vuelva a explorar estas ramas:

- **No hay split payment.** El modelo marketplace "el cliente paga y una parte va directo al
  profesional" no es implementable con Dinelco. Las preguntas 2, 3 y 9 de la lista de abajo
  quedan **sin objeto** (alta de sub-comercios, definición del reparto en el link de cobro,
  sandbox de split): no existe el producto sobre el que preguntaban.
- **Dinelco queda acotado al cobro** (checkout, `0014-dinelco-checkout-integration.md`). Cobra al
  comercio único, que es TekoApp. Todo reparto posterior es 100% responsabilidad nuestra.
- **El bloqueante cambió de naturaleza**: ya no es "qué ofrece Dinelco" (respondido), sino
  **elegir e integrar un proveedor de pagos salientes distinto**. Candidatos que José mencionó:
  SIPAP (el sistema de pagos del BCP), el BCP directamente, u otra solución nacional o
  internacional a nivel bancario. **Ninguno está evaluado todavía** — no hay costos, ni requisitos
  de integración, ni contrato. Eso es lo que hay que averiguar antes de diseñar.

**Estado: se para acá por decisión explícita de José (2026-09-07).** No se escribe modelo de datos
de liquidación hasta tener un proveedor elegido, porque su API define la forma de los datos
(formato de cuenta destino, si liquida por lote o por operación, si hay recall).

---

## Gap nuevo encontrado en esta misma conversación: no hay dónde guardar la cuenta destino

Verificado contra `prisma/schema.prisma` el 2026-09-07: **no existe NINGÚN modelo de datos
bancarios**. Cero coincidencias de `bankAccount`, `bank_account`, `cbu`, `iban`, `accountNumber` o
`routing`. O sea: incluso resuelto el proveedor, hoy no hay dónde persistir a qué cuenta se le
paga a un profesional.

Esto es un entregable propio, previo al diseño de la liquidación pero **posterior** a la elección
del proveedor: el formato de cuenta que hay que validar y almacenar (¿número + banco + tipo?, ¿un
identificador tipo CBU?, ¿alias?) lo define el proveedor elegido. Modelarlo antes es apostar.

Lo que sí se puede afirmar ya sobre ese modelo futuro:

- El titular del payout es un **`Users` que tiene perfil de profesional**, no una entidad aparte
  (ver la nota de modelo de roles más abajo).
- Un dato bancario es información sensible pero **no es dato de tarjeta**: no cae bajo PCI-DSS.
  Se puede almacenar, con cifrado en reposo y acceso restringido — a diferencia de un PAN, que no
  se almacena nunca (ver abajo).

---

## Gap nuevo: el contrato de `PaymentMethodEntity.details` está abierto (riesgo PCI)

`PaymentMethodEntity` (`@@map("payment_methods")`) ya existe y ya tiene las piezas correctas para
trabajar con tokens: `externalId` (el id del método en el proveedor), `expiresAt`, `type`,
`provider`. **El problema es `details Json @db.JsonB`**: es un campo sin contrato documentado, y
nada impide hoy que una implementación futura escriba ahí un número de tarjeta completo o un CVV.

**Posición a respetar cuando se implemente el guardado de tarjetas** (respuesta a la duda de José
sobre "guardar o tokenizar"):

- **Nunca se almacena PAN completo, CVV, ni banda magnética/chip.** Ni cifrado. Guardar un PAN
  mete a TekoApp entero en alcance PCI-DSS (auditoría anual, segmentación de red, escaneos) — es
  un costo desproporcionado frente al beneficio, y el proveedor ya resuelve el problema.
- **Se tokeniza**: el dato de tarjeta viaja del cliente al proveedor (checkout/SDK), y lo único
  que vuelve y se persiste es el token en `externalId`. En `details` solo van datos no sensibles
  para que el usuario reconozca su método: marca, últimos 4 dígitos, mes/año de vencimiento,
  nombre que le puso el usuario.
- Los últimos 4 dígitos y la marca **no** son PAN y sí se pueden guardar — es el estándar de la
  industria para mostrar "Visa ···· 4242".
- **CONFIRMADO por José el 2026-09-07: el checkout de Dinelco SÍ devuelve un token reutilizable
  (card-on-file).** O sea que "guardar mi tarjeta" es implementable: el token va a `externalId` y
  el cobro recurrente/posterior se hace contra ese token, sin que el cliente reingrese el PAN.
  Esto NO cambia nada de lo de arriba — sigue prohibido persistir PAN/CVV; lo que se guarda es el
  token, que es justamente el mecanismo que lo hace innecesario.

---

## Nota de modelo: no existe el concepto "solo profesional"

Aclarado por José el 2026-09-07, y hay que tenerlo presente para no diseñar de más:

**Un profesional es un `Users` con perfil profesional, no un tipo de cuenta separado.** No hay
—ni está previsto— un flujo de alta "solo profesional". Todo el que se registra es usuario, y
puede además tener perfil profesional; un profesional puede consumir servicios como cliente.

Combinaciones que existen de verdad: **solo cliente**, **cliente + profesional**, y
**cliente + profesional + admin**. "Solo profesional" **no existe** como estado.

Esto es consistente con el schema real: los roles se modelan con la tabla puente `UserRoles`
(muchos-a-muchos contra `Roles`), no con un enum `userType` ni un flag `isProfessional` en
`Users`. Implicancia para el payout: la cuenta destino se cuelga del usuario que tiene perfil
profesional, y cualquier diseño que asuma una entidad "profesional" independiente del usuario está
mal encarado desde el principio.

---

## Preguntas originales (2026-09-06) — se conservan por trazabilidad

Se dejan tal cual se escribieron, con el estado de cada una tras la respuesta de José. Las que
siguen abiertas **ya no van dirigidas a Dinelco**, sino al proveedor de pagos salientes que se
elija.

### Lista original

## Preguntas para Dinelco/BEPSA

1. **[RESPONDIDA — NO]** **¿Existe split payment / transferencia a terceros al momento del cobro** (modelo marketplace:
   el cliente paga, una parte va directo al profesional), **o Dinelco solo cobra al comercio único
   y cualquier reparto posterior es responsabilidad nuestra?** Esta es la pregunta que define todo
   lo demás.
2. **[SIN OBJETO — no hay split]** **Si SÍ hay split**: ¿cada profesional necesita darse de alta como sub-comercio propio
   (`riCode`/`sucCode` individual)? ¿Qué documentación/KYC exige Dinelco para aprobar un
   sub-comercio nuevo, y cuánto tarda el alta? (afecta si un profesional puede empezar a cobrar el
   mismo día que se aprueba en la plataforma, o si hay una demora de onboarding bancario).
3. **[SIN OBJETO — no hay split]** **Si SÍ hay split**: ¿el reparto se define al crear el link de cobro (porcentaje/monto fijo por
   sub-comercio en la misma llamada), o es un paso de liquidación aparte después de que el cobro ya
   se acreditó?
4. **[ESTA ES LA RAMA VIVA]** **Si NO hay split**: ¿Dinelco/BEPSA ofrece algún producto de transferencia bancaria por lote
   (nómina/pagos masivos) utilizable para liquidar a profesionales, o hay que integrar un proveedor
   bancario distinto solo para esto?
5. **Costo**: ¿cuánto cobra el split/la transferencia a terceros por operación, y quién lo absorbe
   hoy en el modelo de referencia que ya usa `portal-comercios-backend` (plataforma o el
   sub-comercio receptor)? Esto entra directo en el cálculo de `professionalNetAmount` (D-03 de
   este WORKPLAN).
6. **Frecuencia y mínimos**: ¿con qué frecuencia se puede liquidar (¿inmediato, diario, semanal?) y
   hay un monto mínimo de liquidación por profesional?
7. **Reembolsos posteriores a la liquidación**: si un pago se reembolsa (total o parcialmente,
   TekoApp ya soporta reembolsos parciales acumulativos) **después** de que ya se le pagó al
   profesional, ¿Dinelco soporta algún mecanismo de recall/débito del sub-comercio, o el ajuste
   queda 100% de nuestro lado (descontar de la próxima liquidación, cobrar aparte)?
8. **Datos bancarios del profesional**: ¿la cuenta destino tiene que ser de un banco/billetera
   específico soportado por Dinelco, o acepta cualquiera? ¿Qué formato de cuenta exige (número +
   banco + tipo, algo tipo CBU, otro)?
9. **[SIN OBJETO para split; re-preguntar al proveedor nuevo]** **Ambiente de pruebas**: ¿el sandbox de split/transferencias es el mismo que ya se usa para
   checkout (`0014`), o es un producto/contrato separado que hay que solicitar aparte?
10. **Impositivo**: ¿la transferencia al profesional dispara algún requisito de facturación
    electrónica o retención (IVA/Renta) que Dinelco resuelva de su lado, o queda 100% de nuestro
    lado modelarlo? (relevante porque `TaxConfig` ya existe en el dominio de pagos, pero hoy está
    deshabilitado — `TaxConfig.isEnabled=false`, ver D-03).

## Qué falta después de tener las respuestas

Recién con esto se puede escribir el diseño real de I-02: modelo de datos de liquidación (si hace
falta una tabla `PayoutBatch`/`PayoutTransaction` propia o si se apoya en `PaymentTransaction`
existente), el trigger de cuándo se liquida, y cómo se concilia contra `professionalNetAmount`
(D-03) y contra un reembolso posterior. No se adelanta ese diseño acá para no comprometerse con una
forma de datos que la respuesta a la pregunta 1 puede invalidar por completo.
