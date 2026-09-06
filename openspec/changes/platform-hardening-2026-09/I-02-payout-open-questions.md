# I-02 · Preguntas abiertas para poder diseñar el payout — NO diseñado todavía

Origen: `openspec/changes/platform-hardening-2026-09/WORKPLAN.md` §5, I-02. **Bloqueada por qué
ofrece Dinelco** — no se escribe una spec de diseño porque la respuesta a la primera pregunta de
abajo cambia el diseño entero (payout apoyado en la pasarela vs. proceso propio de liquidación
bancaria). Esto es solo la lista de preguntas concretas que hay que cerrar con Dinelco/BEPSA antes
de poder diseñarla — mismo espíritu que la sección "Datos que igual faltan de la doc oficial" de
`openspec/changes/0014-dinelco-checkout-integration.md`, pero enfocada específicamente en payout
(esa sección ya adelantó la pregunta de split payment; acá se abre el resto que depende de ella).

## Preguntas para Dinelco/BEPSA

1. **¿Existe split payment / transferencia a terceros al momento del cobro** (modelo marketplace:
   el cliente paga, una parte va directo al profesional), **o Dinelco solo cobra al comercio único
   y cualquier reparto posterior es responsabilidad nuestra?** Esta es la pregunta que define todo
   lo demás.
2. **Si SÍ hay split**: ¿cada profesional necesita darse de alta como sub-comercio propio
   (`riCode`/`sucCode` individual)? ¿Qué documentación/KYC exige Dinelco para aprobar un
   sub-comercio nuevo, y cuánto tarda el alta? (afecta si un profesional puede empezar a cobrar el
   mismo día que se aprueba en la plataforma, o si hay una demora de onboarding bancario).
3. **Si SÍ hay split**: ¿el reparto se define al crear el link de cobro (porcentaje/monto fijo por
   sub-comercio en la misma llamada), o es un paso de liquidación aparte después de que el cobro ya
   se acreditó?
4. **Si NO hay split**: ¿Dinelco/BEPSA ofrece algún producto de transferencia bancaria por lote
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
9. **Ambiente de pruebas**: ¿el sandbox de split/transferencias es el mismo que ya se usa para
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
