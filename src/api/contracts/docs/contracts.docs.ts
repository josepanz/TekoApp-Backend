import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ContractPdfResponseDTO,
  ContractResponseDTO,
  ContractsAuditListResponseDTO,
  MyContractsListResponseDTO,
} from '../dtos/response';

export function ApiGetMyContracts() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Listar mis contratos',
      description:
        'Contratos donde el usuario autenticado es cliente o profesional.',
    }),
    ApiResponse({ status: 200, type: MyContractsListResponseDTO }),
  );
}

export function ApiGenerateContract() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Generar un contrato a partir de una opción de presupuesto seleccionada',
      description:
        'Solo el cliente dueño del servicio, y solo si la opción ya fue seleccionada. Idempotente: si ya existe un contrato para esa opción, lo devuelve.',
    }),
    ApiResponse({ status: 201, type: ContractResponseDTO }),
    ApiResponse({
      status: 400,
      description: 'La opción todavía no fue seleccionada.',
    }),
    ApiResponse({
      status: 403,
      description: 'No es el cliente dueño del servicio.',
    }),
  );
}

export function ApiGetContract() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obtener un contrato',
      description: 'Cliente o profesional del contrato.',
    }),
    ApiResponse({ status: 200, type: ContractResponseDTO }),
  );
}

export function ApiSignContract() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Firmar un contrato',
      description:
        'Cliente o profesional del contrato, según a quién le toca. No es una firma digital calificada — ver openspec/specs/service-contracts.md.',
    }),
    ApiResponse({ status: 200, type: ContractResponseDTO }),
    ApiResponse({
      status: 409,
      description: 'Firma duplicada o fuera de turno.',
    }),
  );
}

export function ApiGetContractPdf() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'URL presignada al PDF del contrato firmado',
      description:
        'Cliente, profesional o staff. Solo disponible si status = SIGNED.',
    }),
    ApiResponse({ status: 200, type: ContractPdfResponseDTO }),
    ApiResponse({
      status: 403,
      description: 'El contrato todavía no está firmado por ambos.',
    }),
  );
}

export function ApiGetAdminContracts() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Listado completo de contratos (staff)',
      description: 'Para soporte y disputas legales.',
    }),
    ApiResponse({ status: 200, type: ContractsAuditListResponseDTO }),
  );
}
