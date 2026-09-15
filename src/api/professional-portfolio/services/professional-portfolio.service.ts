import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PortfolioReviewStatus } from '@prisma/client';
import { extname } from 'path';
import { StorageService } from '@modules/storage/services/storage.service';
import { StorageUploadInput } from '@modules/storage/interfaces/storage.interface';
import { ProfessionalPortfolioDbService } from '@modules/professional-portfolio-db/services/professional-portfolio-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import {
  MAX_FILE_SIZE,
  PORTFOLIO_ALLOWED_MIME_TYPES,
} from '@api/uploads/const/uploads.const';
import { t } from '@common/i18n/i18n.helper';
import {
  CreatePortfolioItemRequestDTO,
  GetAdminPortfolioQueryDTO,
  UpdatePortfolioItemRequestDTO,
} from '../dtos/request';
import {
  AdminPortfolioItemsListResponseDTO,
  PortfolioItemResponseDTO,
  PortfolioItemsListResponseDTO,
} from '../dtos/response';
import {
  mapAdminQueueItemsToResponse,
  mapPortfolioItemToResponse,
  mapPortfolioItemsToResponse,
} from '../helpers/professional-portfolio-response.helper';

@Injectable()
export class ProfessionalPortfolioService {
  constructor(
    private readonly portfolioDb: ProfessionalPortfolioDbService,
    private readonly professionalsDb: ProfessionalsDbService,
    private readonly storageService: StorageService,
  ) {}

  async uploadItem(
    userId: number,
    dto: CreatePortfolioItemRequestDTO,
    file: Express.Multer.File,
    createdBy: string,
  ): Promise<PortfolioItemResponseDTO> {
    if (!file) {
      throw new BadRequestException(
        t('professional-portfolio.NO_FILE_UPLOADED'),
      );
    }
    this.validateFile(file);

    const professional = await this.professionalsDb.findByUserId(userId);

    const key = this.buildKey(file.originalname);
    const uploadInput: StorageUploadInput = { file, key };
    await this.storageService.uploadFilesQueue([uploadInput]);

    const item = await this.portfolioDb.create({
      professionalId: professional.id,
      fileKey: key,
      caption: dto.caption,
      status: PortfolioReviewStatus.PENDING,
      createdBy,
    });

    return mapPortfolioItemToResponse(item);
  }

  async myPortfolio(userId: number): Promise<PortfolioItemsListResponseDTO> {
    const professional = await this.professionalsDb.findByUserId(userId);
    const items = await this.portfolioDb.findAllByProfessionalId(
      professional.id,
    );
    return { data: mapPortfolioItemsToResponse(items) };
  }

  async publicPortfolio(
    professionalReferenceId: string,
  ): Promise<PortfolioItemsListResponseDTO> {
    const professional =
      await this.professionalsDb.findProfessionalByReferenceId(
        professionalReferenceId,
      );
    const items = await this.portfolioDb.findPublicByProfessionalId(
      professional.id,
    );
    return { data: mapPortfolioItemsToResponse(items) };
  }

  async updateItem(
    userId: number,
    itemReferenceId: string,
    dto: UpdatePortfolioItemRequestDTO,
    changedBy: string,
  ): Promise<PortfolioItemResponseDTO> {
    const professional = await this.professionalsDb.findByUserId(userId);
    const item = await this.findOwnedItem(itemReferenceId, professional.id);

    const updated = await this.portfolioDb.update(item.id, {
      caption: dto.caption,
      sortOrder: dto.sortOrder,
      isVisible: dto.isVisible,
      lastChangedBy: changedBy,
    });
    return mapPortfolioItemToResponse(updated);
  }

  async deleteItem(userId: number, itemReferenceId: string): Promise<void> {
    const professional = await this.professionalsDb.findByUserId(userId);
    const item = await this.findOwnedItem(itemReferenceId, professional.id);
    await this.portfolioDb.delete(item.id);
  }

  async adminQueue(
    query: GetAdminPortfolioQueryDTO,
  ): Promise<AdminPortfolioItemsListResponseDTO> {
    const { data, pagination } = await this.portfolioDb.findPaginatedForAdmin(
      { status: query.status },
      query as unknown as typeof query & Record<string, unknown>,
    );
    return { data: mapAdminQueueItemsToResponse(data), pagination };
  }

  async review(
    itemReferenceId: string,
    status: PortfolioReviewStatus,
    rejectionReason: string | undefined,
    reviewedBy: string,
  ): Promise<PortfolioItemResponseDTO> {
    const item = await this.portfolioDb.findByReferenceId(itemReferenceId);
    if (!item) {
      throw new NotFoundException(t('professional-portfolio.NOT_FOUND'));
    }

    const updatedCount = await this.portfolioDb.updateStatusConditional(
      item.id,
      [PortfolioReviewStatus.PENDING],
      {
        status,
        reviewedAt: new Date(),
        reviewedBy,
        rejectionReason:
          status === PortfolioReviewStatus.REJECTED ? rejectionReason : null,
      },
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('professional-portfolio.ALREADY_REVIEWED'));
    }

    const updated = await this.portfolioDb.findByReferenceId(itemReferenceId);
    return mapPortfolioItemToResponse(updated);
  }

  private async findOwnedItem(itemReferenceId: string, professionalId: number) {
    const item = await this.portfolioDb.findByReferenceId(itemReferenceId);
    if (!item) {
      throw new NotFoundException(t('professional-portfolio.NOT_FOUND'));
    }
    if (item.professionalId !== professionalId) {
      throw new ForbiddenException(t('professional-portfolio.NOT_OWNER'));
    }
    return item;
  }

  private validateFile(file: Express.Multer.File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        t('professional-portfolio.FILE_TOO_LARGE', {
          maxSizeMb: MAX_FILE_SIZE / (1024 * 1024),
        }),
      );
    }
    if (!PORTFOLIO_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        t('professional-portfolio.FILE_TYPE_NOT_ALLOWED'),
      );
    }
  }

  private buildKey(originalname: string): string {
    const uuid = Array(16)
      .fill(null)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
    return `${uuid}${extname(originalname)}`;
  }
}
