import { Tips } from '@prisma/client';
import { TipResponseDTO } from '../dtos/response';

export function mapTipToResponse(tip: Tips): TipResponseDTO {
  return {
    referenceId: tip.referenceId,
    mode: tip.mode,
    percentage: tip.percentage === null ? null : Number(tip.percentage),
    amount: Number(tip.amount),
    currencyCode: tip.currencyCode,
    createdAt: tip.createdAt,
  };
}
