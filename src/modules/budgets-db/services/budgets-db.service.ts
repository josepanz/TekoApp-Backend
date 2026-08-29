import { Injectable } from '@nestjs/common';
import {
  BudgetLineItemType,
  BudgetOptions,
  Prisma,
  RequestStatus,
  ServiceStatus,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

const optionInclude = {
  lineItems: { include: { catalogItem: { select: { referenceId: true } } } },
} satisfies Prisma.BudgetOptionsInclude;

export type BudgetOptionWithLineItems = Prisma.BudgetOptionsGetPayload<{
  include: typeof optionInclude;
}>;

const fullContextInclude = {
  lineItems: {
    include: { catalogItem: { select: { referenceId: true, name: true } } },
  },
  serviceRequest: {
    include: {
      service: { include: { category: true } },
      professional: { include: { user: true } },
    },
  },
} satisfies Prisma.BudgetOptionsInclude;

export type BudgetOptionWithFullContext = Prisma.BudgetOptionsGetPayload<{
  include: typeof fullContextInclude;
}>;

export interface BudgetLineItemInput {
  itemType: BudgetLineItemType;
  catalogItemId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BudgetOptionInput {
  label: string;
  description?: string;
  estimatedHours?: number;
  totalPrice: number;
  lineItems: BudgetLineItemInput[];
}

@Injectable()
export class BudgetsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findByRequestId(
    serviceRequestId: number,
  ): Promise<BudgetOptionWithLineItems[]> {
    return this.prisma.extended.budgetOptions.findMany({
      where: { serviceRequestId, isActive: true },
      include: optionInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByReferenceId(referenceId: string): Promise<BudgetOptions | null> {
    return this.prisma.extended.budgetOptions.findUnique({
      where: { referenceId },
    });
  }

  /**
   * Usado por `ContractsService.generateContract()` para armar el `contentSnapshot` — trae en una
   * sola query todo lo que el contrato necesita congelar (servicio, categoría, profesional,
   * cliente, línea de ítems), para no releer `BudgetOptions` en vivo después de creado el
   * contrato.
   */
  async findByReferenceIdWithFullContext(
    referenceId: string,
  ): Promise<BudgetOptionWithFullContext | null> {
    return this.prisma.extended.budgetOptions.findUnique({
      where: { referenceId },
      include: fullContextInclude,
    });
  }

  /**
   * Usado por `ServicesService.completeService()` — si el servicio se aceptó vía una opción de
   * presupuesto (en vez de tarifa por hora), `finalAmount` se alimenta de su `totalPrice`. Ver
   * decisión en `openspec/decisions.md`, Fase 0003.
   */
  async findSelectedOptionForService(
    serviceId: number,
  ): Promise<BudgetOptions | null> {
    return this.prisma.extended.budgetOptions.findFirst({
      where: { isSelected: true, serviceRequest: { serviceId } },
    });
  }

  /**
   * Reemplaza el set completo de opciones de una propuesta — borra todas las anteriores y crea
   * las nuevas dentro de la misma transacción. Solo se llama mientras la `ServiceRequests` sigue
   * `PENDING` (validado en el service), así que nunca hay una opción ya seleccionada que preservar.
   */
  async replaceOptionsTransaction(
    serviceRequestId: number,
    createdBy: string,
    options: BudgetOptionInput[],
  ): Promise<BudgetOptionWithLineItems[]> {
    return this.prisma.extended.$transaction(async (tx) => {
      await tx.budgetOptions.deleteMany({ where: { serviceRequestId } });

      const created: BudgetOptionWithLineItems[] = [];
      for (const option of options) {
        const row = await tx.budgetOptions.create({
          data: {
            serviceRequestId,
            label: option.label,
            description: option.description,
            estimatedHours: option.estimatedHours,
            totalPrice: option.totalPrice,
            createdBy,
            lineItems: {
              create: option.lineItems.map((item) => ({
                itemType: item.itemType,
                catalogItemId: item.catalogItemId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })),
            },
          },
          include: optionInclude,
        });
        created.push(row);
      }
      return created;
    });
  }

  /**
   * Extiende `ServicesDbService.acceptRequestTransaction` (mismo criterio: `updateMany`
   * condicional para evitar TOCTOU) con el marcado de la opción elegida — todo en una sola
   * transacción, no dos llamadas separadas.
   */
  async selectOptionTransaction(
    optionId: number,
    serviceRequestId: number,
    serviceId: number,
    professionalId: number,
  ): Promise<number> {
    return this.prisma.extended.$transaction(async (tx) => {
      const serviceUpdateResult = await tx.services.updateMany({
        where: { id: serviceId, status: ServiceStatus.PENDING },
        data: { status: ServiceStatus.ACCEPTED, professionalId },
      });
      if (serviceUpdateResult.count === 0) {
        return 0;
      }

      await tx.serviceRequests.update({
        where: { id: serviceRequestId },
        data: { status: RequestStatus.ACCEPTED },
      });
      await tx.serviceRequests.updateMany({
        where: {
          serviceId,
          status: RequestStatus.PENDING,
          id: { not: serviceRequestId },
        },
        data: { status: RequestStatus.REJECTED },
      });
      await tx.budgetOptions.updateMany({
        where: { serviceRequestId, id: { not: optionId } },
        data: { isSelected: false },
      });
      await tx.budgetOptions.update({
        where: { id: optionId },
        data: { isSelected: true },
      });

      return serviceUpdateResult.count;
    });
  }
}
