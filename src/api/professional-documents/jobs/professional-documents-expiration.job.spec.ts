import { Test, TestingModule } from '@nestjs/testing';
import { DocumentReviewStatus } from '@prisma/client';
import { ProfessionalDocumentsDbService } from '@modules/professional-documents-db/services/professional-documents-db.service';
import { ProfessionalVerificationHelper } from '@modules/professional-documents-db/helpers/professional-verification.helper';
import { NotificationsService } from '@api/notifications/services/notifications.service';
import { ProfessionalDocumentsExpirationJob } from './professional-documents-expiration.job';

const mockFindExpiredApproved = jest.fn();
const mockUpdateStatusConditional = jest.fn();
const mockRecompute = jest.fn();
const mockNotificationsCreate = jest.fn();

describe('ProfessionalDocumentsExpirationJob', () => {
  let job: ProfessionalDocumentsExpirationJob;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalDocumentsExpirationJob,
        {
          provide: ProfessionalDocumentsDbService,
          useValue: {
            findExpiredApproved: mockFindExpiredApproved,
            updateStatusConditional: mockUpdateStatusConditional,
          },
        },
        {
          provide: ProfessionalVerificationHelper,
          useValue: { recompute: mockRecompute },
        },
        {
          provide: NotificationsService,
          useValue: { create: mockNotificationsCreate },
        },
      ],
    }).compile();

    job = module.get<ProfessionalDocumentsExpirationJob>(
      ProfessionalDocumentsExpirationJob,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('no debe hacer nada si no hay documentos vencidos', async () => {
    // Arrange
    mockFindExpiredApproved.mockResolvedValue([]);

    // Act
    await job.run();

    // Assert
    expect(mockUpdateStatusConditional).not.toHaveBeenCalled();
    expect(mockRecompute).not.toHaveBeenCalled();
  });

  it('debe pasar a EXPIRED, notificar al profesional, y recomputar verificación una vez por profesional', async () => {
    // Arrange
    mockFindExpiredApproved.mockResolvedValue([
      { id: 1, professionalId: 100, professional: { userId: 5 } },
      { id: 2, professionalId: 100, professional: { userId: 5 } },
    ]);
    mockUpdateStatusConditional.mockResolvedValue(1);

    // Act
    await job.run();

    // Assert
    expect(mockUpdateStatusConditional).toHaveBeenCalledTimes(2);
    expect(mockUpdateStatusConditional).toHaveBeenCalledWith(
      1,
      [DocumentReviewStatus.APPROVED],
      { status: DocumentReviewStatus.EXPIRED },
    );
    expect(mockNotificationsCreate).toHaveBeenCalledTimes(2);
    expect(mockNotificationsCreate).toHaveBeenCalledWith(expect.any(Object), 5);
    expect(mockRecompute).toHaveBeenCalledTimes(1);
    expect(mockRecompute).toHaveBeenCalledWith(100);
  });

  it('debe saltear un documento que ya cambió de estado por otro proceso (TOCTOU)', async () => {
    // Arrange
    mockFindExpiredApproved.mockResolvedValue([
      { id: 1, professionalId: 100, professional: { userId: 5 } },
    ]);
    mockUpdateStatusConditional.mockResolvedValue(0);

    // Act
    await job.run();

    // Assert
    expect(mockNotificationsCreate).not.toHaveBeenCalled();
    expect(mockRecompute).not.toHaveBeenCalled();
  });
});
