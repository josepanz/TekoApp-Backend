import { PaymentDisputeWithRelations } from '@modules/payment-disputes-db/services/payment-disputes-db.service';
import { DisputePartyResponseDTO, DisputeResponseDTO } from '../dtos/response';

function mapParty(
  party: { referenceId: string; firstName: string; lastName: string } | null,
): DisputePartyResponseDTO | null {
  if (!party) return null;
  return {
    referenceId: party.referenceId,
    firstName: party.firstName,
    lastName: party.lastName,
  };
}

export function mapDisputeToResponse(
  dispute: PaymentDisputeWithRelations,
): DisputeResponseDTO {
  return {
    referenceId: dispute.referenceId,
    paymentReferenceId: dispute.payment.referenceId,
    reason: dispute.reason,
    description: dispute.description,
    evidenceKeys: dispute.evidenceKeys,
    status: dispute.status,
    openedBy: mapParty(dispute.openedBy),
    adjudicatedBy: mapParty(dispute.adjudicatedBy),
    resolution: dispute.resolution,
    resolutionNotes: dispute.resolutionNotes,
    refundAmount:
      dispute.refundAmount === null ? null : Number(dispute.refundAmount),
    resolvedAt: dispute.resolvedAt,
    createdAt: dispute.createdAt,
  };
}

export function mapDisputesToResponse(
  disputes: PaymentDisputeWithRelations[],
): DisputeResponseDTO[] {
  return disputes.map(mapDisputeToResponse);
}
