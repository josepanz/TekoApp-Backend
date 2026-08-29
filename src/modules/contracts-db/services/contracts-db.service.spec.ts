import { Test, TestingModule } from '@nestjs/testing';
import { ContractStatus, Prisma } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ContractsDbService } from './contracts-db.service';

const mockFindUnique = jest.fn();
const mockCreate = jest.fn<Promise<unknown>, [Prisma.ContractsCreateArgs]>();
const mockUpdateMany = jest.fn<
  Promise<{ count: number }>,
  [Prisma.ContractsUpdateManyArgs]
>();
const mockUpdate = jest.fn();
const mockFindMany = jest.fn<
  Promise<unknown[]>,
  [Prisma.ContractsFindManyArgs]
>();
const mockCount = jest.fn();

const mockPrisma = {
  extended: {
    contracts: {
      findUnique: mockFindUnique,
      create: mockCreate,
      updateMany: mockUpdateMany,
      update: mockUpdate,
      findMany: mockFindMany,
      count: mockCount,
    },
  },
};

describe('ContractsDbService', () => {
  let service: ContractsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContractsDbService>(ContractsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByUserId', () => {
    it('debe buscar contratos donde el usuario es cliente o profesional', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findByUserId(7);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ clientUserId: 7 }, { professional: { userId: 7 } }],
          },
        }),
      );
    });
  });

  describe('findByBudgetOptionId', () => {
    it('debe buscar el contrato por el id interno de la opción de presupuesto', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act
      await service.findByBudgetOptionId(10);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { budgetOptionId: 10 } }),
      );
    });
  });

  describe('create', () => {
    it('debe crear el contrato directo en PENDING_CLIENT_SIGNATURE', async () => {
      // Arrange
      mockCreate.mockResolvedValue({});

      // Act
      await service.create({
        serviceId: 1,
        budgetOptionId: 2,
        clientUserId: 3,
        professionalId: 4,
        legalTermsVersionId: null,
        contentSnapshot: { service: {} },
        createdBy: 'user-ref',
      });

      // Assert
      expect(mockCreate.mock.calls[0][0].data.status).toBe(
        ContractStatus.PENDING_CLIENT_SIGNATURE,
      );
    });
  });

  describe('signAsClientTransaction', () => {
    it('debe actualizar solo si el estado actual es PENDING_CLIENT_SIGNATURE', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      const count = await service.signAsClientTransaction(
        1,
        'Juan Pérez',
        'hash',
        new Date(),
      );

      // Assert
      expect(count).toBe(1);
      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, status: ContractStatus.PENDING_CLIENT_SIGNATURE },
        }),
      );
    });

    it('debe devolver 0 cuando el contrato ya no está en el estado esperado (firma fuera de turno)', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 0 });

      // Act
      const count = await service.signAsClientTransaction(
        1,
        'Juan Pérez',
        'hash',
        new Date(),
      );

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('signAsProfessionalTransaction', () => {
    it('debe transicionar a SIGNED solo si estaba en PENDING_PROFESSIONAL_SIGNATURE', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      const count = await service.signAsProfessionalTransaction(
        1,
        'Ana Gómez',
        'hash',
        new Date(),
      );

      // Assert
      expect(count).toBe(1);
      const callArgs = mockUpdateMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({
        id: 1,
        status: ContractStatus.PENDING_PROFESSIONAL_SIGNATURE,
      });
      expect(callArgs.data).toMatchObject({ status: ContractStatus.SIGNED });
    });
  });

  describe('setPdfKey', () => {
    it('debe guardar la key del PDF generado', async () => {
      // Arrange
      mockUpdate.mockResolvedValue({});

      // Act
      await service.setPdfKey(1, 'contracts/abc.pdf');

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { pdfKey: 'contracts/abc.pdf' },
      });
    });
  });

  describe('findAuditPaginated', () => {
    it('debe paginar incluyendo los referenceId de servicio, cliente y profesional', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      // Act
      await service.findAuditPaginated({ page: 1, pageSize: 10 });

      // Assert
      expect(mockFindMany.mock.calls[0][0].include).toEqual({
        service: { select: { referenceId: true } },
        client: { select: { referenceId: true } },
        professional: { select: { referenceId: true } },
      });
    });
  });
});
