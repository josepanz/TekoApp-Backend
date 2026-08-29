import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  AiContentDisclosures,
  AiDisclosureEntityType,
  AiDisclosureSource,
} from '@prisma/client';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { AiDisclosuresDbService } from '@modules/ai-disclosures-db/services/ai-disclosures-db.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';
import { t } from '@common/i18n/i18n.helper';
import { DeclareAiDisclosureRequestDTO } from '../dtos/request/declare-ai-disclosure.request.dto';
import { AiDisclosureEntityParamDTO } from '../dtos/request/ai-disclosure-entity.param.dto';
import { GetAiDisclosuresAdminQueryDTO } from '../dtos/request/get-ai-disclosures-admin.query.dto';

@Injectable()
export class AiDisclosuresService {
  constructor(
    private readonly aiDisclosuresDb: AiDisclosuresDbService,
    private readonly servicesDb: ServicesDbService,
    private readonly professionalsDb: ProfessionalsDbService,
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {}

  /**
   * Resuelve el dueño real de la entidad referenciada — solo conoce los tipos de contenido que
   * hoy existen de verdad (`SERVICE_DESCRIPTION`/`PROFESSIONAL_DESCRIPTION`, ver
   * `TekoApp-Frontend-Mobile/openspec/changes/0011-ai-content-disclosure.md`). Un tipo sin resolver
   * acá nunca puede pasar `userDeclarableTypes` sin agregarse también un `case` — la lista de
   * config y este switch avanzan juntos.
   */
  private async resolveOwnerUserId(
    entityType: AiDisclosureEntityType,
    entityReferenceId: string,
  ): Promise<number | null> {
    switch (entityType) {
      case AiDisclosureEntityType.SERVICE_DESCRIPTION: {
        const service =
          await this.servicesDb.findServiceByReferenceId(entityReferenceId);
        return service?.userId ?? null;
      }
      case AiDisclosureEntityType.PROFESSIONAL_DESCRIPTION: {
        const professional =
          await this.professionalsDb.findByReferenceId(entityReferenceId);
        return professional?.userId ?? null;
      }
      default:
        return null;
    }
  }

  async declare(
    userId: number,
    dto: DeclareAiDisclosureRequestDTO,
    createdBy: string,
  ): Promise<AiContentDisclosures> {
    const { userDeclarableTypes } = this.configService.aiDisclosure;
    if (!userDeclarableTypes.includes(dto.entityType)) {
      throw new BadRequestException(
        t('ai-disclosures.ENTITY_TYPE_NOT_DECLARABLE'),
      );
    }

    const ownerUserId = await this.resolveOwnerUserId(
      dto.entityType,
      dto.entityReferenceId,
    );
    if (ownerUserId === null) {
      throw new NotFoundException(t('ai-disclosures.ENTITY_NOT_FOUND'));
    }
    if (ownerUserId !== userId) {
      throw new ForbiddenException(t('ai-disclosures.NOT_CONTENT_OWNER'));
    }

    return this.aiDisclosuresDb.upsertDisclosure({
      entityType: dto.entityType,
      entityReferenceId: dto.entityReferenceId,
      source: AiDisclosureSource.USER_DECLARED_AI,
      declaredByUserId: userId,
      note: dto.note,
      createdBy,
    });
  }

  async retract(
    userId: number,
    param: AiDisclosureEntityParamDTO,
  ): Promise<void> {
    const existing = await this.aiDisclosuresDb.findByEntity(
      param.entityType,
      param.entityReferenceId,
    );
    if (!existing) {
      throw new NotFoundException(t('ai-disclosures.DISCLOSURE_NOT_FOUND'));
    }
    if (existing.declaredByUserId !== userId) {
      throw new ForbiddenException(t('ai-disclosures.NOT_CONTENT_OWNER'));
    }

    await this.aiDisclosuresDb.deleteByEntity(
      param.entityType,
      param.entityReferenceId,
    );
  }

  async findByEntity(
    param: AiDisclosureEntityParamDTO,
  ): Promise<AiContentDisclosures | null> {
    return this.aiDisclosuresDb.findByEntity(
      param.entityType,
      param.entityReferenceId,
    );
  }

  async findPaginatedForAdmin(query: GetAiDisclosuresAdminQueryDTO): Promise<{
    data: AiContentDisclosures[];
    pagination: PaginationResponseDTO;
  }> {
    return this.aiDisclosuresDb.findPaginated(
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
    );
  }
}
