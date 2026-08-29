import { Contracts } from '@prisma/client';
import {
  ContractAuditRow,
  ContractWithLegalTerms,
} from '@modules/contracts-db/services/contracts-db.service';
import {
  ContractAuditResponseDTO,
  ContractContentSnapshotDTO,
  ContractResponseDTO,
  MyContractSummaryResponseDTO,
} from '../dtos/response';

export function mapContractToResponse(
  contract: ContractWithLegalTerms,
  viewerRole: 'CLIENT' | 'PROFESSIONAL',
): ContractResponseDTO {
  return {
    referenceId: contract.referenceId,
    status: contract.status,
    viewerRole,
    contentSnapshot:
      contract.contentSnapshot as unknown as ContractContentSnapshotDTO,
    legalTermsVersion: contract.legalTermsVersion
      ? {
          referenceId: contract.legalTermsVersion.referenceId,
          version: contract.legalTermsVersion.version,
          contentUrl: contract.legalTermsVersion.contentUrl,
        }
      : null,
    clientSignedAt: contract.clientSignedAt,
    professionalSignedAt: contract.professionalSignedAt,
    pdfAvailable: contract.status === 'SIGNED',
  };
}

export function mapContractToAuditResponse(
  contract: ContractAuditRow,
): ContractAuditResponseDTO {
  return {
    referenceId: contract.referenceId,
    status: contract.status,
    serviceReferenceId: contract.service.referenceId,
    clientReferenceId: contract.client.referenceId,
    professionalReferenceId: contract.professional.referenceId,
    createdAt: contract.createdAt,
    clientSignedAt: contract.clientSignedAt,
    professionalSignedAt: contract.professionalSignedAt,
    pdfAvailable: contract.status === 'SIGNED',
  };
}

export function mapContractsToAuditResponse(
  contracts: ContractAuditRow[],
): ContractAuditResponseDTO[] {
  return contracts.map(mapContractToAuditResponse);
}

export function mapContractToMySummary(
  contract: Contracts,
): MyContractSummaryResponseDTO {
  const snapshot =
    contract.contentSnapshot as unknown as ContractContentSnapshotDTO;
  return {
    referenceId: contract.referenceId,
    status: contract.status,
    serviceTitle: snapshot.service.title,
    createdAt: contract.createdAt,
    pdfAvailable: contract.status === 'SIGNED',
  };
}

export function mapContractsToMySummary(
  contracts: Contracts[],
): MyContractSummaryResponseDTO[] {
  return contracts.map(mapContractToMySummary);
}
