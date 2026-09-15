import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { BudgetsDbService } from '@modules/budgets-db/services/budgets-db.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { MaterialCatalogDbService } from '@modules/material-catalog-db/services/material-catalog-db.service';
import { NotificationsService } from '@api/notifications/services/notifications.service';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';
import { t } from '@common/i18n/i18n.helper';
import { ReplaceBudgetOptionsRequestDTO } from '../dtos/request';
import {
  BudgetOptionResponseDTO,
  BudgetOptionsListResponseDTO,
} from '../dtos/response';
import {
  mapOptionsToResponse,
  mapOptionToResponse,
} from '../helpers/budgets-response.helper';

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetsDb: BudgetsDbService,
    private readonly servicesDb: ServicesDbService,
    private readonly materialCatalogDb: MaterialCatalogDbService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveServiceAndRequest(
    serviceReferenceId: string,
    requestReferenceId: string,
  ) {
    const service =
      await this.servicesDb.findServiceByReferenceId(serviceReferenceId);
    if (!service) throw new NotFoundException(t('budgets.SERVICE_NOT_FOUND'));

    const request = await this.servicesDb.findServiceRequestByReferenceId(
      requestReferenceId,
      service.id,
    );
    if (!request) throw new NotFoundException(t('budgets.REQUEST_NOT_FOUND'));

    return { service, request };
  }

  async replaceOptions(
    serviceReferenceId: string,
    requestReferenceId: string,
    dto: ReplaceBudgetOptionsRequestDTO,
    userId: number,
    createdBy: string,
  ): Promise<BudgetOptionsListResponseDTO> {
    const { service, request } = await this.resolveServiceAndRequest(
      serviceReferenceId,
      requestReferenceId,
    );

    const professional = await this.servicesDb.findProfessionalByUserId(userId);
    if (!professional || request.professionalId !== professional.id) {
      throw new ForbiddenException(t('budgets.ONLY_REQUEST_AUTHOR_CAN_EDIT'));
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(t('budgets.REQUEST_NOT_EDITABLE'));
    }

    const maxOptions = service.category.maxBudgetOptionsPerRequest;
    if (dto.options.length > maxOptions) {
      throw new BadRequestException(
        t('budgets.MAX_OPTIONS_EXCEEDED', { max: maxOptions }),
      );
    }

    const referencedCatalogIds = [
      ...new Set(
        dto.options
          .flatMap((option) => option.lineItems)
          .map((item) => item.catalogItemReferenceId)
          .filter((ref): ref is string => !!ref),
      ),
    ];
    const catalogItems = referencedCatalogIds.length
      ? await this.materialCatalogDb.findManyByReferenceIds(
          referencedCatalogIds,
        )
      : [];
    const catalogById = new Map(
      catalogItems.map((item) => [item.referenceId, item]),
    );
    for (const ref of referencedCatalogIds) {
      if (!catalogById.has(ref)) {
        throw new BadRequestException(t('budgets.CATALOG_ITEM_NOT_FOUND'));
      }
    }

    const options = dto.options.map((option) => {
      const lineItems = option.lineItems.map((item) => ({
        itemType: item.itemType,
        catalogItemId: item.catalogItemReferenceId
          ? catalogById.get(item.catalogItemReferenceId).id
          : undefined,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: roundCurrency(item.quantity * item.unitPrice),
      }));
      const totalPrice = roundCurrency(
        lineItems.reduce((sum, item) => sum + item.subtotal, 0),
      );
      return {
        label: option.label,
        description: option.description,
        estimatedHours: option.estimatedHours,
        totalPrice,
        lineItems,
      };
    });

    const created = await this.budgetsDb.replaceOptionsTransaction(
      request.id,
      createdBy,
      options,
    );

    // I-05 (#9, IMPRESCINDIBLE): el cliente no sabe que ya puede revisar opciones a menos que
    // vuelva a abrir la app — avisar después de que la transacción ya commiteó.
    await this.notificationsService.create(
      {
        title: t('budgets.NOTIFICATION_OPTIONS_READY_TITLE'),
        message: t('budgets.NOTIFICATION_OPTIONS_READY_MESSAGE'),
        type: NotificationType.BUDGET_OPTIONS_READY,
        channels: ['in_app', 'push'],
      },
      service.userId,
    );

    return { data: mapOptionsToResponse(created) };
  }

  async listOptions(
    serviceReferenceId: string,
    requestReferenceId: string,
    userId: number,
  ): Promise<BudgetOptionsListResponseDTO> {
    const { service, request } = await this.resolveServiceAndRequest(
      serviceReferenceId,
      requestReferenceId,
    );

    const professional = await this.servicesDb.findProfessionalByUserId(userId);
    const isOwner = service.userId === userId;
    const isAuthor =
      !!professional && request.professionalId === professional.id;
    if (!isOwner && !isAuthor) {
      throw new ForbiddenException(t('budgets.NOT_AUTHORIZED'));
    }

    const options = await this.budgetsDb.findByRequestId(request.id);
    return { data: mapOptionsToResponse(options) };
  }

  async selectOption(
    serviceReferenceId: string,
    requestReferenceId: string,
    optionReferenceId: string,
    userId: number,
  ): Promise<BudgetOptionResponseDTO> {
    const { service, request } = await this.resolveServiceAndRequest(
      serviceReferenceId,
      requestReferenceId,
    );
    if (service.userId !== userId) {
      throw new ForbiddenException(t('budgets.ONLY_CLIENT_CAN_SELECT'));
    }

    const option = await this.budgetsDb.findByReferenceId(optionReferenceId);
    if (!option || option.serviceRequestId !== request.id) {
      throw new NotFoundException(t('budgets.OPTION_NOT_FOUND'));
    }

    const updatedCount = await this.budgetsDb.selectOptionTransaction(
      option.id,
      request.id,
      service.id,
      request.professionalId,
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('budgets.NO_LONGER_AVAILABLE'));
    }

    // I-05 (#10, IMPRESCINDIBLE): ruta de asignación equivalente a #2 cuando el servicio pasó
    // por presupuestos — avisar al profesional autor de la opción elegida, después del commit.
    const professional = await this.servicesDb.findProfessionalById(
      request.professionalId,
    );
    if (professional) {
      await this.notificationsService.create(
        {
          title: t('budgets.NOTIFICATION_OPTION_SELECTED_TITLE'),
          message: t('budgets.NOTIFICATION_OPTION_SELECTED_MESSAGE'),
          type: NotificationType.BUDGET_OPTION_SELECTED,
          channels: ['in_app', 'push'],
        },
        professional.userId,
      );
    }

    const refreshedOptions = await this.budgetsDb.findByRequestId(request.id);
    const selected = refreshedOptions.find(
      (o) => o.referenceId === optionReferenceId,
    );
    if (!selected) throw new NotFoundException(t('budgets.OPTION_NOT_FOUND'));
    return mapOptionToResponse(selected);
  }
}
