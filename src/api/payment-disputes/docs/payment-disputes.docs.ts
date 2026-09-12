import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  DisputeResponseDTO,
  DisputesListResponseDTO,
  DisputesQueueResponseDTO,
} from '../dtos/response';

export function ApiOpenDispute() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Abrir una disputa sobre un pago',
      description:
        'Solo el cliente o el profesional del pago. Solo un pago COMPLETED/PARTIAL_REFUNDED ' +
        'puede disputarse, y no puede haber otra disputa OPEN/UNDER_REVIEW ya abierta sobre el ' +
        'mismo pago.',
    }),
    ApiResponse({ status: 201, type: DisputeResponseDTO }),
    ApiResponse({
      status: 403,
      description: 'No es cliente ni profesional del pago.',
    }),
    ApiResponse({
      status: 409,
      description: 'Ya existe una disputa abierta sobre este pago.',
    }),
  );
}

export function ApiListPaymentDisputes() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Historial de disputas de un pago',
      description:
        'Cliente, profesional, o staff con payments.audit:read/admin:all.',
    }),
    ApiResponse({ status: 200, type: DisputesListResponseDTO }),
  );
}

export function ApiWithdrawDispute() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Retirar una disputa propia',
      description:
        'Solo quien la abrió, y solo mientras siga OPEN (sin staff asignado).',
    }),
    ApiResponse({ status: 200, type: DisputeResponseDTO }),
    ApiResponse({ status: 409, description: 'Ya fue tomada o resuelta.' }),
  );
}

export function ApiListDisputesQueue() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Cola de disputas para staff',
      description:
        'Paginada, filtrable por status. Requiere disputes.adjudication:manage.',
    }),
    ApiResponse({ status: 200, type: DisputesQueueResponseDTO }),
  );
}

export function ApiClaimDispute() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Tomar una disputa para revisarla',
      description:
        'OPEN -> UNDER_REVIEW. Requiere disputes.adjudication:manage.',
    }),
    ApiResponse({ status: 200, type: DisputeResponseDTO }),
    ApiResponse({ status: 409, description: 'Otro staff ya la tomó.' }),
  );
}

export function ApiResolveDispute() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Adjudicar una disputa',
      description:
        'RESOLVED/REJECTED. Si la resolución es FULL_REFUND/PARTIAL_REFUND, dispara el ' +
        'reembolso (PaymentDbService.executeRefund) dentro de la misma transacción. Requiere ' +
        'disputes.adjudication:manage.',
    }),
    ApiResponse({ status: 200, type: DisputeResponseDTO }),
    ApiResponse({
      status: 400,
      description: 'refundAmount faltante para una resolución que reembolsa.',
    }),
    ApiResponse({
      status: 409,
      description: 'La disputa ya no es adjudicable.',
    }),
  );
}
