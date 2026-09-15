import { calculateProfessionalNetAmount } from './professional-net-amount.helper';

describe('calculateProfessionalNetAmount', () => {
  it('debe restar la comision de plataforma y el IVA del monto bruto sin reembolsos', () => {
    // Arrange
    const payment = {
      amount: 100000,
      platformFee: 10000,
      tax: 1300,
      totalAmount: 111300,
      refundDetails: null,
    };

    // Act
    const result = calculateProfessionalNetAmount(payment);

    // Assert
    expect(result).toBe(88700); // 100000 - 10000 - 1300
  });

  it('debe dar el monto bruto completo cuando comision e IVA son 0 (config no cargada)', () => {
    // Arrange — refleja el estado real de este proyecto hoy: `TaxConfig.isEnabled=false` por
    // default y `PlatformCommissionConfig` sin fila en el seed de producción.
    const payment = {
      amount: 50000,
      platformFee: 0,
      tax: 0,
      totalAmount: 50000,
      refundDetails: null,
    };

    // Act
    const result = calculateProfessionalNetAmount(payment);

    // Assert
    expect(result).toBe(50000);
  });

  it('debe reducir el neto proporcionalmente cuando hay un reembolso parcial', () => {
    // Arrange — reembolso del 50% del total (55650 de 111300)
    const payment = {
      amount: 100000,
      platformFee: 10000,
      tax: 1300,
      totalAmount: 111300,
      refundDetails: {
        refundedAmount: 55650,
        refundReason: 'CUSTOMER_REQUEST',
      },
    };

    // Act
    const result = calculateProfessionalNetAmount(payment);

    // Assert
    expect(result).toBe(44350); // (100000 - 10000 - 1300) * 0.5
  });

  it('debe dar neto 0 cuando el reembolso es total', () => {
    // Arrange
    const payment = {
      amount: 100000,
      platformFee: 10000,
      tax: 1300,
      totalAmount: 111300,
      refundDetails: { refundedAmount: 111300 },
    };

    // Act
    const result = calculateProfessionalNetAmount(payment);

    // Assert
    expect(result).toBe(0);
  });

  it('no debe superar el 100% de reembolso aunque el dato venga inconsistente', () => {
    // Arrange — refundedAmount mayor a totalAmount no debería nunca pasar (executeRefund lo
    // valida), pero el helper no debe devolver un neto negativo si igual llega así.
    const payment = {
      amount: 100000,
      platformFee: 10000,
      tax: 1300,
      totalAmount: 111300,
      refundDetails: { refundedAmount: 999999 },
    };

    // Act
    const result = calculateProfessionalNetAmount(payment);

    // Assert
    expect(result).toBe(0);
  });

  it('debe tratar campos faltantes o no numericos como 0 en vez de propagar NaN', () => {
    // Arrange
    const payment = {
      amount: 100000,
      platformFee: undefined,
      tax: null,
      totalAmount: 100000,
      refundDetails: null,
    };

    // Act
    const result = calculateProfessionalNetAmount(payment);

    // Assert
    expect(result).toBe(100000);
    expect(Number.isNaN(result)).toBe(false);
  });

  it('debe ignorar un refundDetails con forma inesperada (sin refundedAmount numerico)', () => {
    // Arrange
    const payment = {
      amount: 100000,
      platformFee: 10000,
      tax: 1300,
      totalAmount: 111300,
      refundDetails: { refundReason: 'algo', refundedAmount: 'no-numerico' },
    };

    // Act
    const result = calculateProfessionalNetAmount(payment);

    // Assert
    expect(result).toBe(88700);
  });
});
