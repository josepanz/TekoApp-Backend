/**
 * D-03 (openspec/changes/platform-hardening-2026-09/WORKPLAN.md): `professionalNetAmount` existía
 * en el DTO de respuesta y en la columna `payments.professional_net_amount`, pero ningún servicio
 * lo escribía nunca — siempre viajaba `null`. José eligió la opción (b): calcularlo ya (monto -
 * comisión de plataforma - IVA), aunque el flujo de payout real (I-02) todavía no exista.
 *
 * Fuente de comisión/IVA: NO se recalculan acá contra la config actual — se usan `platformFee` y
 * `tax`, ya calculados y persistidos por pago al crearlo (`PaymentApiService.createPayment`, vía
 * `FeeCalculatorService.calculatePlatformFee`/`TaxService.calculateTax`). Recalcular con la config
 * vigente HOY daría un número distinto al que realmente se cobró en ese pago si la config cambió
 * desde entonces — usar el valor ya persistido es lo único históricamente correcto.
 *
 * Dos datos reales de este proyecto que importan para leer el resultado con criterio, no porque
 * este helper los invente:
 *   - `TaxConfig.isEnabled` es `false` por default (decisión deliberada, ver `openspec/decisions.md`
 *     Fase 0011 — la tasa real de IVA está pendiente de asesoría fiscal) → `tax` es 0 en la
 *     práctica en todo pago hasta que se cargue una tasa real.
 *   - `PlatformCommissionConfig` no tiene ninguna fila en el seed de producción (`prisma/seed.ts`);
 *     el único valor que existe (10%) está en `prisma/seed-dummy.ts`, explícitamente datos de
 *     prueba. `platformFee` refleja lo que haya estado activo (o nada) al crear cada pago.
 *
 * Reembolsos parciales/totales: `refundDetails.refundedAmount` (acumulado, trackeado TOCTOU-safe
 * en `PaymentDbService.executeRefund` contra `totalAmount`) reduce el neto en la misma proporción
 * que se le devolvió al cliente sobre el total — se asume que un reembolso reduce
 * proporcionalmente monto/comisión/impuesto por igual, no que sale entero de la parte del
 * profesional. Sin reembolsos, el resultado es simplemente `amount - platformFee - tax`.
 */

interface PaymentForNetAmount {
  amount?: unknown;
  platformFee?: unknown;
  tax?: unknown;
  totalAmount?: unknown;
  refundDetails?: unknown;
}

// Defensivo: en la fila real de Prisma estos 4 campos son NOT NULL con default 0.00, así que
// nunca deberían faltar — pero un `select` parcial o un fixture de test incompleto no debe
// convertirse en un `NaN` filtrado a la respuesta de la API.
function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function extractRefundedAmount(refundDetails: unknown): number {
  if (
    typeof refundDetails === 'object' &&
    refundDetails !== null &&
    'refundedAmount' in refundDetails
  ) {
    const value = refundDetails.refundedAmount;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateProfessionalNetAmount(
  payment: PaymentForNetAmount,
): number {
  const amount = toSafeNumber(payment.amount);
  const platformFee = toSafeNumber(payment.platformFee);
  const tax = toSafeNumber(payment.tax);
  const totalAmount = toSafeNumber(payment.totalAmount);

  const grossNet = amount - platformFee - tax;

  const refundedAmount = extractRefundedAmount(payment.refundDetails);
  if (refundedAmount <= 0 || totalAmount <= 0) {
    return round2(grossNet);
  }

  const refundRatio = Math.min(refundedAmount / totalAmount, 1);
  return round2(grossNet * (1 - refundRatio));
}
