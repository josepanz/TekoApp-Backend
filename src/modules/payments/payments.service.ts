import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod, PaymentProvider } from './entities/payment.entity';
import { PaymentMethodEntity } from './entities/payment-method.entity';
import { PaymentTransaction, TransactionType, TransactionStatus } from './entities/payment-transaction.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentMethodEntity)
    private readonly paymentMethodRepository: Repository<PaymentMethodEntity>,
    @InjectRepository(PaymentTransaction)
    private readonly transactionRepository: Repository<PaymentTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== PAGOS ====================

  async createPayment(userId: string, createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Verificar que no exista un pago para esta solicitud de servicio
    const existingPayment = await this.paymentRepository.findOne({
      where: { userId, serviceRequestId: createPaymentDto.serviceRequestId },
    });

    if (existingPayment) {
      throw new BadRequestException('Ya existe un pago para esta solicitud de servicio');
    }

    // Calcular comisiones e impuestos
    const fee = this.calculateFee(createPaymentDto.amount, createPaymentDto.paymentProvider);
    const tax = this.calculateTax(createPaymentDto.amount + fee);
    const totalAmount = createPaymentDto.amount + fee + tax;

    // Crear el pago
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      userId,
      fee,
      tax,
      totalAmount,
      transactionId: uuidv4(),
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Crear la transacción inicial
    await this.createTransaction(savedPayment.id, {
      type: TransactionType.PAYMENT,
      amount: totalAmount,
      status: TransactionStatus.PENDING,
      externalTransactionId: uuidv4(),
    });

    return savedPayment;
  }

  async findAllPayments(userId?: string, professionalId?: string, status?: PaymentStatus): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId });
    }

    if (professionalId) {
      queryBuilder.andWhere('payment.professionalId = :professionalId', { professionalId });
    }

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    return queryBuilder
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.professional', 'professional')
      .leftJoinAndSelect('payment.serviceRequest', 'serviceRequest')
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  async findPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'professional', 'serviceRequest'],
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return payment;
  }

  async findPaymentByTransactionId(transactionId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId },
      relations: ['user', 'professional', 'serviceRequest'],
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return payment;
  }

  async updatePayment(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findPaymentById(id);

    // Solo se pueden actualizar pagos pendientes
    if (!payment.isPending()) {
      throw new BadRequestException('Solo se pueden actualizar pagos pendientes');
    }

    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async cancelPayment(id: string, userId: string): Promise<Payment> {
    const payment = await this.findPaymentById(id);

    // Verificar que el usuario sea el propietario del pago
    if (payment.userId !== userId) {
      throw new ForbiddenException('No tienes permisos para cancelar este pago');
    }

    if (!payment.canBeCancelled()) {
      throw new BadRequestException('Este pago no puede ser cancelado');
    }

    payment.status = PaymentStatus.CANCELLED;
    return this.paymentRepository.save(payment);
  }

  async refundPayment(id: string, refundDto: RefundPaymentDto, adminId?: string): Promise<Payment> {
    const payment = await this.findPaymentById(id);

    if (!payment.isRefundable()) {
      throw new BadRequestException('Este pago no puede ser reembolsado');
    }

    if (refundDto.amount > payment.getRefundableAmount()) {
      throw new BadRequestException('El monto del reembolso excede el monto disponible');
    }

    // Crear transacción de reembolso
    await this.createTransaction(payment.id, {
      type: TransactionType.REFUND,
      amount: refundDto.amount,
      status: TransactionStatus.PROCESSING,
      externalTransactionId: uuidv4(),
      description: `Reembolso: ${refundDto.reason}`,
    });

    // Actualizar detalles del reembolso
    payment.refundDetails = {
      refundedAmount: (payment.refundDetails?.refundedAmount || 0) + refundDto.amount,
      refundReason: refundDto.reason,
      refundedAt: new Date(),
    };

    // Actualizar estado si es reembolso completo
    if (payment.refundDetails.refundedAmount >= payment.totalAmount) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    return this.paymentRepository.save(payment);
  }

  // ==================== MÉTODOS DE PAGO ====================

  async createPaymentMethod(userId: string, createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodEntity> {
    // Si es el método por defecto, desactivar otros métodos por defecto
    if (createPaymentMethodDto.isDefault) {
      await this.paymentMethodRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    const paymentMethod = this.paymentMethodRepository.create({
      ...createPaymentMethodDto,
      userId,
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async findAllPaymentMethods(userId: string): Promise<PaymentMethodEntity[]> {
    return this.paymentMethodRepository.find({
      where: { userId, isActive: true },
      orderBy: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  async findPaymentMethodById(id: string, userId: string): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Método de pago no encontrado');
    }

    return paymentMethod;
  }

  async updatePaymentMethod(id: string, userId: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.findPaymentMethodById(id, userId);

    // Si se está marcando como por defecto, desactivar otros
    if (updatePaymentMethodDto.isDefault) {
      await this.paymentMethodRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(paymentMethod, updatePaymentMethodDto);
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async deletePaymentMethod(id: string, userId: string): Promise<void> {
    const paymentMethod = await this.findPaymentMethodById(id, userId);

    // Verificar que no sea el único método de pago
    const totalMethods = await this.paymentMethodRepository.count({ where: { userId, isActive: true } });
    if (totalMethods <= 1) {
      throw new BadRequestException('No se puede eliminar el único método de pago');
    }

    // Desactivar en lugar de eliminar
    paymentMethod.isActive = false;
    await this.paymentMethodRepository.save(paymentMethod);
  }

  async setDefaultPaymentMethod(id: string, userId: string): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.findPaymentMethodById(id, userId);

    // Desactivar otros métodos por defecto
    await this.paymentMethodRepository.update(
      { userId, isDefault: true },
      { isDefault: false }
    );

    // Marcar este como por defecto
    paymentMethod.isDefault = true;
    return this.paymentMethodRepository.save(paymentMethod);
  }

  // ==================== TRANSACCIONES ====================

  async createTransaction(
    paymentId: string,
    transactionData: Partial<PaymentTransaction>
  ): Promise<PaymentTransaction> {
    const transaction = this.transactionRepository.create({
      ...transactionData,
      paymentId,
    });

    return this.transactionRepository.save(transaction);
  }

  async findTransactionsByPaymentId(paymentId: string): Promise<PaymentTransaction[]> {
    return this.transactionRepository.find({
      where: { paymentId },
      orderBy: { createdAt: 'ASC' },
    });
  }

  async updateTransactionStatus(
    externalTransactionId: string,
    status: TransactionStatus,
    additionalData?: Record<string, any>
  ): Promise<PaymentTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { externalTransactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }

    transaction.status = status;
    
    if (status === TransactionStatus.COMPLETED) {
      transaction.processedAt = new Date();
    } else if (status === TransactionStatus.FAILED) {
      transaction.failedAt = new Date();
      transaction.failureReason = additionalData?.failureReason;
      transaction.errorDetails = additionalData?.errorDetails;
    }

    if (additionalData) {
      transaction.transactionDetails = {
        ...transaction.transactionDetails,
        ...additionalData,
      };
    }

    return this.transactionRepository.save(transaction);
  }

  // ==================== ESTADÍSTICAS ====================

  async getPaymentSummary(userId?: string, professionalId?: string): Promise<any> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId });
    }

    if (professionalId) {
      queryBuilder.andWhere('payment.professionalId = :professionalId', { professionalId });
    }

    const [totalPayments, totalAmount, successfulPayments, failedPayments] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.select('SUM(payment.totalAmount)', 'total').getRawOne(),
      queryBuilder.andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED }).getCount(),
      queryBuilder.andWhere('payment.status = :status', { status: PaymentStatus.FAILED }).getCount(),
    ]);

    const total = parseFloat(totalAmount?.total || '0');
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    const averageAmount = totalPayments > 0 ? total / totalPayments : 0;

    return {
      totalPayments,
      totalAmount: total,
      successfulPayments,
      failedPayments,
      successRate: Math.round(successRate * 100) / 100,
      averageAmount: Math.round(averageAmount * 100) / 100,
    };
  }

  async getPaymentTrends(days: number = 30, userId?: string): Promise<any[]> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId });
    }

    const trends = await queryBuilder
      .select([
        'DATE(payment.createdAt) as date',
        'COUNT(*) as totalPayments',
        'SUM(payment.totalAmount) as totalAmount',
        'COUNT(CASE WHEN payment.status = :completedStatus THEN 1 END) as successfulPayments',
        'COUNT(CASE WHEN payment.status = :failedStatus THEN 1 END) as failedPayments',
      ])
      .setParameter('completedStatus', PaymentStatus.COMPLETED)
      .setParameter('failedStatus', PaymentStatus.FAILED)
      .andWhere('payment.createdAt >= :startDate', {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      })
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return trends.map(trend => ({
      date: trend.date,
      totalPayments: parseInt(trend.totalPayments),
      totalAmount: parseFloat(trend.totalAmount || '0'),
      successfulPayments: parseInt(trend.successfulPayments),
      failedPayments: parseInt(trend.failedPayments),
    }));
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private calculateFee(amount: number, provider: PaymentProvider): number {
    // Lógica para calcular comisiones según el proveedor
    const feeRates = {
      [PaymentProvider.STRIPE]: 0.029, // 2.9% + $0.30
      [PaymentProvider.PAYPAL]: 0.029, // 2.9% + $0.30
      [PaymentProvider.MERCADOPAGO]: 0.039, // 3.9%
      [PaymentProvider.RAPIPAGO]: 0.05, // 5%
      [PaymentProvider.PAGOFACIL]: 0.05, // 5%
      [PaymentProvider.CASH]: 0, // Sin comisión
    };

    const rate = feeRates[provider] || 0.029;
    const fixedFee = provider === PaymentProvider.STRIPE || provider === PaymentProvider.PAYPAL ? 0.30 : 0;
    
    return Math.round((amount * rate + fixedFee) * 100) / 100;
  }

  private calculateTax(amount: number): number {
    // Lógica para calcular impuestos (IVA, etc.)
    const taxRate = 0.21; // 21% IVA en Argentina
    return Math.round(amount * taxRate * 100) / 100;
  }

  // ==================== WEBHOOKS ====================

  async processWebhook(provider: PaymentProvider, payload: any, signature?: string): Promise<void> {
    // Verificar firma del webhook
    if (!this.verifyWebhookSignature(provider, payload, signature)) {
      throw new BadRequestException('Firma del webhook inválida');
    }

    // Procesar según el proveedor
    switch (provider) {
      case PaymentProvider.STRIPE:
        await this.processStripeWebhook(payload);
        break;
      case PaymentProvider.PAYPAL:
        await this.processPayPalWebhook(payload);
        break;
      case PaymentProvider.MERCADOPAGO:
        await this.processMercadoPagoWebhook(payload);
        break;
      default:
        throw new BadRequestException('Proveedor de pagos no soportado');
    }
  }

  private async processStripeWebhook(payload: any): Promise<void> {
    const { type, data } = payload;

    switch (type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(data.object);
        break;
      case 'charge.refunded':
        await this.handleRefundSuccess(data.object);
        break;
    }
  }

  private async processPayPalWebhook(payload: any): Promise<void> {
    // Implementar lógica para PayPal
  }

  private async processMercadoPagoWebhook(payload: any): Promise<void> {
    // Implementar lógica para MercadoPago
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { externalTransactionId: paymentIntent.id },
    });

    if (transaction) {
      await this.updateTransactionStatus(paymentIntent.id, TransactionStatus.COMPLETED);
      
      // Actualizar estado del pago
      const payment = await this.findPaymentById(transaction.paymentId);
      payment.status = PaymentStatus.COMPLETED;
      payment.processedAt = new Date();
      payment.externalTransactionId = paymentIntent.id;
      
      await this.paymentRepository.save(payment);
    }
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { externalTransactionId: paymentIntent.id },
    });

    if (transaction) {
      await this.updateTransactionStatus(paymentIntent.id, TransactionStatus.FAILED, {
        failureReason: paymentIntent.last_payment_error?.message || 'Pago fallido',
      });
      
      // Actualizar estado del pago
      const payment = await this.findPaymentById(transaction.paymentId);
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Pago fallido';
      
      await this.paymentRepository.save(payment);
    }
  }

  private async handleRefundSuccess(refund: any): Promise<void> {
    // Implementar lógica para reembolsos exitosos
  }

  private verifyWebhookSignature(provider: PaymentProvider, payload: any, signature?: string): boolean {
    // Implementar verificación de firma según el proveedor
    // Por ahora retornamos true para desarrollo
    return true;
  }
}
