import {
  mapPaymentToResponse,
  mapPaymentsToResponse,
} from './payments-response.helper';

describe('mapPaymentToResponse', () => {
  const basePayment = {
    id: 1,
    referenceId: 'pay-uuid-0001',
    serviceId: 30,
    service: { referenceId: 'svc-uuid-0001' },
    amount: 100000,
    platformFee: 10000,
    tax: 1300,
    totalAmount: 111300,
    refundDetails: null,
    professionalNetAmount: null, // la columna cruda de Prisma: nunca escrita, siempre null
  };

  it('debe calcular professionalNetAmount en vez de dejar pasar el null de la columna cruda', () => {
    // Arrange & Act
    const result = mapPaymentToResponse(basePayment);

    // Assert
    expect(result.professionalNetAmount).toBe(88700);
  });

  it('debe seguir resolviendo serviceId al referenceId del servicio, no la PK interna', () => {
    // Arrange & Act
    const result = mapPaymentToResponse(basePayment);

    // Assert
    expect(result.serviceId).toBe('svc-uuid-0001');
  });

  it('debe reflejar reembolsos parciales en professionalNetAmount vía mapPaymentsToResponse', () => {
    // Arrange
    const refunded = {
      ...basePayment,
      refundDetails: { refundedAmount: 55650 },
    };

    // Act
    const [result] = mapPaymentsToResponse([refunded]);

    // Assert
    expect(result.professionalNetAmount).toBe(44350);
  });
});
