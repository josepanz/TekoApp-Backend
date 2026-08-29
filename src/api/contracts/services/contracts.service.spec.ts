import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContractStatus, Prisma } from '@prisma/client';
import { ContractsService } from './contracts.service';
import { ContractsDbService } from '@modules/contracts-db/services/contracts-db.service';
import { BudgetsDbService } from '@modules/budgets-db/services/budgets-db.service';
import { LegalConsentsDbService } from '@modules/legal-consents-db/services/legal-consents-db.service';
import { StorageService } from '@modules/storage/services/storage.service';
import { ReportService } from '@modules/report/services/report.service';

const mockFindByReferenceIdWithFullContext = jest.fn();
const mockFindByBudgetOptionId = jest.fn();
const mockFindActiveVersionByType = jest.fn();
const mockCreate = jest.fn();
const mockFindByReferenceId = jest.fn();
const mockSignAsClientTransaction = jest.fn();
const mockSignAsProfessionalTransaction = jest.fn();
const mockSetPdfKey = jest.fn();
const mockFindAuditPaginated = jest.fn();
const mockFindByUserId = jest.fn();
const mockGetPresignedUrlQueue = jest.fn();
const mockUploadFilesQueue = jest.fn();
const mockGenerate = jest.fn();

const CLIENT_USER_ID = 1;
const PROFESSIONAL_USER_ID = 2;
const PROFESSIONAL_ID = 20;

const mockOption = {
  id: 100,
  label: 'Estándar',
  description: null,
  totalPrice: new Prisma.Decimal(500),
  estimatedHours: null,
  isSelected: true,
  lineItems: [
    {
      itemType: 'LABOR',
      description: 'Mano de obra',
      quantity: new Prisma.Decimal(1),
      unitPrice: new Prisma.Decimal(500),
      subtotal: new Prisma.Decimal(500),
      catalogItem: null,
    },
  ],
  serviceRequest: {
    service: {
      id: 10,
      userId: CLIENT_USER_ID,
      title: 'Pintura de living',
      description: 'Pintar el living',
      category: { name: 'Pintura' },
    },
    professional: { id: PROFESSIONAL_ID },
  },
};

const mockContract = {
  id: 5,
  referenceId: 'contract-ref',
  status: ContractStatus.PENDING_CLIENT_SIGNATURE,
  clientUserId: CLIENT_USER_ID,
  client: { firstName: 'Juan', lastName: 'Pérez' },
  professional: {
    id: PROFESSIONAL_ID,
    userId: PROFESSIONAL_USER_ID,
    user: { firstName: 'Ana', lastName: 'Gómez' },
  },
  contentSnapshot: {
    service: { title: 'Pintura de living', description: 'Pintar el living' },
    budgetOption: { label: 'Estándar', totalPrice: 500 },
    lineItems: [],
  },
  legalTermsVersion: null,
  clientSignatureName: null,
  professionalSignatureName: null,
  clientSignedAt: null,
  professionalSignedAt: null,
  pdfKey: null,
};

describe('ContractsService', () => {
  let service: ContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: ContractsDbService,
          useValue: {
            findByBudgetOptionId: mockFindByBudgetOptionId,
            create: mockCreate,
            findByReferenceId: mockFindByReferenceId,
            signAsClientTransaction: mockSignAsClientTransaction,
            signAsProfessionalTransaction: mockSignAsProfessionalTransaction,
            setPdfKey: mockSetPdfKey,
            findAuditPaginated: mockFindAuditPaginated,
            findByUserId: mockFindByUserId,
          },
        },
        {
          provide: BudgetsDbService,
          useValue: {
            findByReferenceIdWithFullContext:
              mockFindByReferenceIdWithFullContext,
          },
        },
        {
          provide: LegalConsentsDbService,
          useValue: { findActiveVersionByType: mockFindActiveVersionByType },
        },
        {
          provide: StorageService,
          useValue: {
            getPresignedUrlQueue: mockGetPresignedUrlQueue,
            uploadFilesQueue: mockUploadFilesQueue,
          },
        },
        { provide: ReportService, useValue: { generate: mockGenerate } },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('generateContract', () => {
    it('debe crear el contrato cuando el cliente dueño del servicio genera desde la opción seleccionada', async () => {
      // Arrange
      mockFindByReferenceIdWithFullContext.mockResolvedValue(mockOption);
      mockFindByBudgetOptionId.mockResolvedValue(null);
      mockFindActiveVersionByType.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockContract);

      // Act
      const result = await service.generateContract(
        'option-ref',
        CLIENT_USER_ID,
        'user-ref',
      );

      // Assert
      expect(mockCreate).toHaveBeenCalled();
      expect(result.referenceId).toBe('contract-ref');
    });

    it('debe rechazar la generación si quien la pide no es el cliente dueño del servicio', async () => {
      // Arrange
      mockFindByReferenceIdWithFullContext.mockResolvedValue(mockOption);

      // Act & Assert
      await expect(
        service.generateContract('option-ref', 999, 'user-ref'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar la generación si la opción todavía no fue seleccionada', async () => {
      // Arrange
      mockFindByReferenceIdWithFullContext.mockResolvedValue({
        ...mockOption,
        isSelected: false,
      });

      // Act & Assert
      await expect(
        service.generateContract('option-ref', CLIENT_USER_ID, 'user-ref'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe devolver el contrato existente sin crear uno nuevo si ya se generó antes (idempotente)', async () => {
      // Arrange
      mockFindByReferenceIdWithFullContext.mockResolvedValue(mockOption);
      mockFindByBudgetOptionId.mockResolvedValue(mockContract);

      // Act
      const result = await service.generateContract(
        'option-ref',
        CLIENT_USER_ID,
        'user-ref',
      );

      // Assert
      expect(mockCreate).not.toHaveBeenCalled();
      expect(result.referenceId).toBe('contract-ref');
    });

    it('debe lanzar NotFoundException si la opción de presupuesto no existe', async () => {
      // Arrange
      mockFindByReferenceIdWithFullContext.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateContract('option-ref', CLIENT_USER_ID, 'user-ref'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getContract', () => {
    it('debe informar viewerRole PROFESSIONAL cuando lo pide el profesional del contrato', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(mockContract);

      // Act
      const result = await service.getContract(
        'contract-ref',
        PROFESSIONAL_USER_ID,
      );

      // Assert
      expect(result.viewerRole).toBe('PROFESSIONAL');
    });

    it('debe informar viewerRole CLIENT cuando lo pide el cliente del contrato', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(mockContract);

      // Act
      const result = await service.getContract('contract-ref', CLIENT_USER_ID);

      // Assert
      expect(result.viewerRole).toBe('CLIENT');
    });
  });

  describe('signContract', () => {
    it('debe permitir al cliente firmar primero y dejar el contrato pendiente de la firma del profesional', async () => {
      // Arrange
      mockFindByReferenceId
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce({
          ...mockContract,
          status: ContractStatus.PENDING_PROFESSIONAL_SIGNATURE,
        })
        .mockResolvedValueOnce({
          ...mockContract,
          status: ContractStatus.PENDING_PROFESSIONAL_SIGNATURE,
        });
      mockSignAsClientTransaction.mockResolvedValue(1);

      // Act
      const result = await service.signContract(
        'contract-ref',
        CLIENT_USER_ID,
        {
          fullName: 'Juan Pérez',
          accepted: true,
        },
      );

      // Assert
      expect(mockSignAsClientTransaction).toHaveBeenCalled();
      expect(result.status).toBe(ContractStatus.PENDING_PROFESSIONAL_SIGNATURE);
    });

    it('debe generar el PDF recién cuando firma el profesional y el contrato queda SIGNED', async () => {
      // Arrange
      const pendingProfessionalContract = {
        ...mockContract,
        status: ContractStatus.PENDING_PROFESSIONAL_SIGNATURE,
      };
      const signedContract = { ...mockContract, status: ContractStatus.SIGNED };
      mockFindByReferenceId
        .mockResolvedValueOnce(pendingProfessionalContract)
        .mockResolvedValueOnce(signedContract)
        .mockResolvedValueOnce(signedContract);
      mockSignAsProfessionalTransaction.mockResolvedValue(1);
      mockGenerate.mockResolvedValue(Buffer.from('pdf'));
      mockUploadFilesQueue.mockResolvedValue([{}]);

      // Act
      const result = await service.signContract(
        'contract-ref',
        PROFESSIONAL_USER_ID,
        { fullName: 'Ana Gómez', accepted: true },
      );

      // Assert
      expect(mockGenerate).toHaveBeenCalled();
      expect(mockUploadFilesQueue).toHaveBeenCalled();
      expect(mockSetPdfKey).toHaveBeenCalled();
      expect(result.status).toBe(ContractStatus.SIGNED);
    });

    it('debe rechazar con 409 una firma fuera de turno o duplicada', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(mockContract);
      mockSignAsClientTransaction.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.signContract('contract-ref', CLIENT_USER_ID, {
          fullName: 'Juan Pérez',
          accepted: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar la firma si el checkbox de aceptación no viene en true', async () => {
      // Act & Assert
      await expect(
        service.signContract('contract-ref', CLIENT_USER_ID, {
          fullName: 'Juan Pérez',
          accepted: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar la firma de quien no es cliente ni profesional del contrato', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(mockContract);

      // Act & Assert
      await expect(
        service.signContract('contract-ref', 999, {
          fullName: 'Alguien más',
          accepted: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listMine', () => {
    it('debe mapear el título del servicio desde el contentSnapshot congelado', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue([mockContract]);

      // Act
      const result = await service.listMine(CLIENT_USER_ID);

      // Assert
      expect(result.data[0].serviceTitle).toBe('Pintura de living');
    });
  });

  describe('getPdfUrl', () => {
    const baseUser = {
      id: CLIENT_USER_ID,
      referenceId: 'ref',
      email: 'a@a.com',
      firstName: 'A',
      lastName: 'B',
      accessLevelId: 1,
      userStatus: 'ACTIVE' as const,
      profileStatus: 'COMPLETE' as const,
      permissions: [],
      roles: [],
    };

    it('debe rechazar con 403 si el contrato todavía no está firmado por ambos', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(mockContract);

      // Act & Assert
      await expect(service.getPdfUrl('contract-ref', baseUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe devolver la URL presignada cuando el contrato está SIGNED', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({
        ...mockContract,
        status: ContractStatus.SIGNED,
        pdfKey: 'contracts/abc.pdf',
      });
      mockGetPresignedUrlQueue.mockResolvedValue('https://s3/presigned');

      // Act
      const result = await service.getPdfUrl('contract-ref', baseUser);

      // Assert
      expect(result.url).toBe('https://s3/presigned');
    });
  });
});
