import { IExcelColumn } from '@modules/report/domain/types/report.type';
import { PaymentDetailResponseDTO } from '../dtos/response';

export const PAYMENTS_EXPORT_COLUMNS: IExcelColumn[] = [
  { header: 'ID', key: 'referenceId' },
  { header: 'Usuario', key: 'userId' },
  { header: 'Profesional', key: 'professionalId' },
  { header: 'Servicio', key: 'serviceId' },
  { header: 'Monto', key: 'amount' },
  { header: 'Comisión proveedor', key: 'fee' },
  { header: 'Impuesto', key: 'tax' },
  { header: 'Comisión plataforma', key: 'platformFee' },
  { header: 'Total', key: 'totalAmount' },
  { header: 'Moneda', key: 'currencyCode' },
  { header: 'Estado', key: 'status' },
  { header: 'Método', key: 'paymentMethod' },
  { header: 'Proveedor', key: 'paymentProvider' },
  { header: 'Transacción', key: 'transactionId' },
  { header: 'Creado', key: 'createdAt' },
];

export function mapPaymentsToExportRows(
  payments: PaymentDetailResponseDTO[],
): Record<string, unknown>[] {
  return payments.map((payment) => ({
    referenceId: payment.referenceId,
    userId: payment.userId,
    professionalId: payment.professionalId,
    serviceId: payment.serviceId,
    amount: payment.amount,
    fee: payment.fee,
    tax: payment.tax,
    platformFee: payment.platformFee,
    totalAmount: payment.totalAmount,
    currencyCode: payment.currencyCode,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    paymentProvider: payment.paymentProvider,
    transactionId: payment.transactionId,
    createdAt: payment.createdAt.toISOString(),
  }));
}
