import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentReviewStatus } from '@prisma/client';
import { StorageService } from '@modules/storage/services/storage.service';
import { StorageUploadInput } from '@modules/storage/interfaces/storage.interface';
import { ProfessionalDocumentsDbService } from '@modules/professional-documents-db/services/professional-documents-db.service';
import { ProfessionalVerificationHelper } from '@modules/professional-documents-db/helpers/professional-verification.helper';
import { ProfessionalDocumentTypesDbService } from '@modules/professional-document-types-db/services/professional-document-types-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@api/uploads/const/uploads.const';
import { t } from '@common/i18n/i18n.helper';
import { extname } from 'path';
import {
  CreateProfessionalDocumentRequestDTO,
  GetAdminProfessionalDocumentsQueryDTO,
} from '../dtos/request';
import {
  AdminProfessionalDocumentsListResponseDTO,
  MyDocumentsListResponseDTO,
  ProfessionalDocumentResponseDTO,
  ProfessionalDocumentsListResponseDTO,
} from '../dtos/response';
import {
  mapAdminQueueDocumentsToResponse,
  mapDocumentToResponse,
  mapDocumentsToResponse,
  mapMyDocumentStatus,
} from '../helpers/professional-documents-response.helper';

@Injectable()
export class ProfessionalDocumentsService {
  constructor(
    private readonly documentsDb: ProfessionalDocumentsDbService,
    private readonly documentTypesDb: ProfessionalDocumentTypesDbService,
    private readonly professionalsDb: ProfessionalsDbService,
    private readonly verificationHelper: ProfessionalVerificationHelper,
    private readonly storageService: StorageService,
  ) {}

  async uploadDocument(
    userId: number,
    dto: CreateProfessionalDocumentRequestDTO,
    file: Express.Multer.File,
    createdBy: string,
  ): Promise<ProfessionalDocumentResponseDTO> {
    if (!file) {
      throw new BadRequestException(
        t('professional-documents.NO_FILE_UPLOADED'),
      );
    }
    this.validateFile(file);

    const professional = await this.professionalsDb.findByUserId(userId);
    const documentType = await this.documentTypesDb.findByReferenceId(
      dto.professionalDocumentTypeReferenceId,
    );
    if (
      !documentType ||
      !this.isApplicable(documentType, professional.categoryId)
    ) {
      throw new NotFoundException(
        t('professional-documents.DOCUMENT_TYPE_NOT_APPLICABLE'),
      );
    }

    const key = this.buildKey(file.originalname);
    const uploadInput: StorageUploadInput = { file, key };
    await this.storageService.uploadFilesQueue([uploadInput]);

    const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();
    const expiresAt = documentType.validityDays
      ? new Date(
          issuedAt.getTime() + documentType.validityDays * 24 * 60 * 60 * 1000,
        )
      : null;
    const autoApprove = !documentType.requiresStaffReview;

    const document = await this.documentsDb.create({
      professionalId: professional.id,
      professionalDocumentTypeId: documentType.id,
      fileKey: key,
      status: autoApprove
        ? DocumentReviewStatus.APPROVED
        : DocumentReviewStatus.PENDING,
      issuedAt,
      expiresAt,
      reviewedAt: autoApprove ? new Date() : null,
      createdBy,
    });

    if (autoApprove) {
      await this.verificationHelper.recompute(professional.id);
    }

    return mapDocumentToResponse(document);
  }

  async myDocuments(userId: number): Promise<MyDocumentsListResponseDTO> {
    const professional = await this.professionalsDb.findByUserId(userId);
    const [applicableTypes, documents] = await Promise.all([
      this.documentTypesDb.findApplicableForCategory(professional.categoryId),
      this.documentsDb.findAllByProfessionalId(professional.id),
    ]);

    // "Estado propio de cada tipo requerido + cargado" — el más reciente por tipo, ya que
    // `findAllByProfessionalId` viene ordenado por createdAt desc.
    const latestByType = new Map<number, (typeof documents)[number]>();
    for (const document of documents) {
      if (!latestByType.has(document.professionalDocumentTypeId)) {
        latestByType.set(document.professionalDocumentTypeId, document);
      }
    }

    return {
      data: applicableTypes.map((type) =>
        mapMyDocumentStatus(type, latestByType.get(type.id)),
      ),
    };
  }

  async publicDocuments(
    professionalReferenceId: string,
  ): Promise<ProfessionalDocumentsListResponseDTO> {
    const professional =
      await this.professionalsDb.findProfessionalByReferenceId(
        professionalReferenceId,
      );
    const documents = await this.documentsDb.findPublicByProfessionalId(
      professional.id,
    );
    return { data: mapDocumentsToResponse(documents) };
  }

  async adminDocuments(
    professionalReferenceId: string,
  ): Promise<ProfessionalDocumentsListResponseDTO> {
    const professional =
      await this.professionalsDb.findProfessionalByReferenceId(
        professionalReferenceId,
      );
    const documents = await this.documentsDb.findAllByProfessionalId(
      professional.id,
    );
    return { data: mapDocumentsToResponse(documents) };
  }

  async adminQueue(
    query: GetAdminProfessionalDocumentsQueryDTO,
  ): Promise<AdminProfessionalDocumentsListResponseDTO> {
    const { data, pagination } = await this.documentsDb.findPaginatedForAdmin(
      { status: query.status, category: query.category },
      query as unknown as typeof query & Record<string, unknown>,
    );
    return { data: mapAdminQueueDocumentsToResponse(data), pagination };
  }

  async review(
    documentReferenceId: string,
    status: DocumentReviewStatus,
    rejectionReason: string | undefined,
    reviewedBy: string,
  ): Promise<ProfessionalDocumentResponseDTO> {
    const document =
      await this.documentsDb.findByReferenceId(documentReferenceId);
    if (!document) {
      throw new NotFoundException(t('professional-documents.NOT_FOUND'));
    }

    const expiresAt =
      status === DocumentReviewStatus.APPROVED &&
      document.professionalDocumentType.validityDays
        ? new Date(
            (document.issuedAt ?? new Date()).getTime() +
              document.professionalDocumentType.validityDays *
                24 *
                60 *
                60 *
                1000,
          )
        : document.expiresAt;

    const updatedCount = await this.documentsDb.updateStatusConditional(
      document.id,
      [DocumentReviewStatus.PENDING],
      {
        status,
        reviewedAt: new Date(),
        reviewedBy,
        rejectionReason:
          status === DocumentReviewStatus.REJECTED ? rejectionReason : null,
        expiresAt,
      },
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('professional-documents.ALREADY_REVIEWED'));
    }

    await this.verificationHelper.recompute(document.professionalId);

    const updated =
      await this.documentsDb.findByReferenceId(documentReferenceId);
    return mapDocumentToResponse(updated);
  }

  private isApplicable(
    documentType: {
      countryId: number | null;
      professionalCategoryId: number | null;
    },
    professionalCategoryId: number,
  ): boolean {
    // countryId siempre null hoy (ver ProfessionalDocumentTypesDbService.findApplicableForCategory).
    return (
      documentType.countryId === null &&
      (documentType.professionalCategoryId === null ||
        documentType.professionalCategoryId === professionalCategoryId)
    );
  }

  private validateFile(file: Express.Multer.File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        t('professional-documents.FILE_TOO_LARGE', {
          maxSizeMb: MAX_FILE_SIZE / (1024 * 1024),
        }),
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        t('professional-documents.FILE_TYPE_NOT_ALLOWED'),
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
