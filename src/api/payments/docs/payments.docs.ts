import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  PaymentDetailResponseDTO,
  PaymentMethodDetailResponseDTO,
  PaymentSummaryResponseDTO,
  PaymentTrendsResponseDTO,
} from '../dtos/response';

export const ApiCreatePayment = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Crear un nuevo pago' }),
    ApiResponse({
      status: 201,
      description: 'Pago creado exitosamente',
      type: PaymentDetailResponseDTO,
    }),
    ApiResponse({
      status: 400,
      description: 'Ya existe un pago para esta solicitud',
    }),
  );

export const ApiGetPayments = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Obtener lista de pagos con filtros' }),
    ApiResponse({
      status: 200,
      description: 'Lista de pagos obtenida',
      type: [PaymentDetailResponseDTO],
    }),
  );

export const ApiGetPaymentSummary = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Obtener resumen de métricas de pagos' }),
    ApiResponse({
      status: 200,
      description: 'Resumen obtenido',
      type: PaymentSummaryResponseDTO,
    }),
  );

export const ApiGetPaymentTrends = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Obtener tendencias de pagos' }),
    ApiResponse({
      status: 200,
      description: 'Tendencias obtenidas',
      type: PaymentTrendsResponseDTO,
    }),
  );

export const ApiGetPaymentById = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Obtener un pago por ID' }),
    ApiResponse({
      status: 200,
      description: 'Pago encontrado',
      type: PaymentDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Pago no encontrado' }),
  );

export const ApiUpdatePayment = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Actualizar un pago' }),
    ApiResponse({
      status: 200,
      description: 'Pago actualizado',
      type: PaymentDetailResponseDTO,
    }),
    ApiResponse({
      status: 400,
      description: 'Solo se pueden actualizar pagos pendientes',
    }),
  );

export const ApiCancelPayment = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Cancelar un pago' }),
    ApiResponse({
      status: 200,
      description: 'Pago cancelado',
      type: PaymentDetailResponseDTO,
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos para cancelar este pago',
    }),
  );

export const ApiRefundPayment = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Reembolsar un pago' }),
    ApiResponse({
      status: 200,
      description: 'Reembolso procesado',
      type: PaymentDetailResponseDTO,
    }),
    ApiResponse({
      status: 400,
      description: 'El monto del reembolso excede el disponible',
    }),
  );

export const ApiCreatePaymentMethod = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Crear un método de pago' }),
    ApiResponse({
      status: 201,
      description: 'Método de pago creado',
      type: PaymentMethodDetailResponseDTO,
    }),
  );

export const ApiUpdatePaymentMethod = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Actualizar un método de pago' }),
    ApiResponse({
      status: 200,
      description: 'Método de pago actualizado',
      type: PaymentMethodDetailResponseDTO,
    }),
    ApiResponse({ status: 404, description: 'Método de pago no encontrado' }),
  );

export const ApiDeletePaymentMethod = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Eliminar un método de pago' }),
    ApiResponse({ status: 204, description: 'Método de pago eliminado' }),
    ApiResponse({
      status: 400,
      description: 'No se puede eliminar el único método de pago',
    }),
  );

export const ApiHandleWebhook = () =>
  applyDecorators(
    ApiOperation({ summary: 'Recibir webhook de proveedor de pagos' }),
    ApiResponse({ status: 200, description: 'Webhook procesado' }),
  );
