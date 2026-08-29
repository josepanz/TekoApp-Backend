import { Test, TestingModule } from '@nestjs/testing';
import {
  BudgetLineItemType,
  RequestStatus,
  ServiceStatus,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { BudgetsDbService } from './budgets-db.service';

const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockTransaction = jest.fn();

const mockPrisma = {
  extended: {
    budgetOptions: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      findFirst: mockFindFirst,
    },
    $transaction: mockTransaction,
  },
};

describe('BudgetsDbService', () => {
  let service: BudgetsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BudgetsDbService>(BudgetsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByRequestId', () => {
    it('debe buscar las opciones activas de la solicitud, incluyendo sus line items', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findByRequestId(10);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceRequestId: 10, isActive: true },
        }),
      );
    });
  });

  describe('findSelectedOptionForService', () => {
    it('debe buscar la opción marcada como seleccionada para el servicio', async () => {
      // Arrange
      mockFindFirst.mockResolvedValue(null);

      // Act
      await service.findSelectedOptionForService(10);

      // Assert
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { isSelected: true, serviceRequest: { serviceId: 10 } },
      });
    });
  });

  describe('replaceOptionsTransaction', () => {
    it('debe borrar las opciones anteriores y crear las nuevas con sus line items', async () => {
      // Arrange
      const mockDeleteManyTx = jest.fn().mockResolvedValue({ count: 2 });
      const mockCreateTx = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          referenceId: 'option-1',
          lineItems: [],
        })
        .mockResolvedValueOnce({
          id: 2,
          referenceId: 'option-2',
          lineItems: [],
        });
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            budgetOptions: {
              deleteMany: mockDeleteManyTx,
              create: mockCreateTx,
            },
          };
          return callback(txClient);
        },
      );

      const options = [
        {
          label: 'Económica',
          totalPrice: 50000,
          lineItems: [
            {
              itemType: BudgetLineItemType.MATERIAL,
              catalogItemId: 3,
              description: 'Cerámica',
              quantity: 10,
              unitPrice: 5000,
              subtotal: 50000,
            },
          ],
        },
        {
          label: 'Premium',
          totalPrice: 90000,
          lineItems: [
            {
              itemType: BudgetLineItemType.LABOR,
              description: 'Mano de obra',
              quantity: 1,
              unitPrice: 90000,
              subtotal: 90000,
            },
          ],
        },
      ];

      // Act
      const result = await service.replaceOptionsTransaction(
        10,
        'prof-ref-1',
        options,
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(mockDeleteManyTx).toHaveBeenCalledWith({
        where: { serviceRequestId: 10 },
      });
      expect(mockCreateTx).toHaveBeenNthCalledWith(1, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- jest.fn() sin generics tipa el argumento como `any`
        data: expect.objectContaining({
          serviceRequestId: 10,
          label: 'Económica',
          totalPrice: 50000,
          createdBy: 'prof-ref-1',
          lineItems: {
            create: [
              expect.objectContaining({
                itemType: BudgetLineItemType.MATERIAL,
                catalogItemId: 3,
                subtotal: 50000,
              }),
            ],
          },
        }),
        include: expect.any(Object) as object,
      });
    });
  });

  describe('selectOptionTransaction', () => {
    it('debe aceptar el servicio, rechazar competidoras y marcar la opción seleccionada', async () => {
      // Arrange
      const mockServicesUpdateManyTx = jest
        .fn()
        .mockResolvedValue({ count: 1 });
      const mockServiceRequestsUpdateTx = jest.fn().mockResolvedValue({});
      const mockServiceRequestsUpdateManyTx = jest.fn().mockResolvedValue({});
      const mockBudgetOptionsUpdateManyTx = jest.fn().mockResolvedValue({});
      const mockBudgetOptionsUpdateTx = jest.fn().mockResolvedValue({});
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            services: { updateMany: mockServicesUpdateManyTx },
            serviceRequests: {
              update: mockServiceRequestsUpdateTx,
              updateMany: mockServiceRequestsUpdateManyTx,
            },
            budgetOptions: {
              updateMany: mockBudgetOptionsUpdateManyTx,
              update: mockBudgetOptionsUpdateTx,
            },
          };
          return callback(txClient);
        },
      );

      // Act
      const result = await service.selectOptionTransaction(1, 10, 100, 5);

      // Assert
      expect(result).toBe(1);
      expect(mockServicesUpdateManyTx).toHaveBeenCalledWith({
        where: { id: 100, status: ServiceStatus.PENDING },
        data: { status: ServiceStatus.ACCEPTED, professionalId: 5 },
      });
      expect(mockServiceRequestsUpdateTx).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: RequestStatus.ACCEPTED },
      });
      expect(mockBudgetOptionsUpdateManyTx).toHaveBeenCalledWith({
        where: { serviceRequestId: 10, id: { not: 1 } },
        data: { isSelected: false },
      });
      expect(mockBudgetOptionsUpdateTx).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isSelected: true },
      });
    });

    it('debe devolver 0 sin tocar nada cuando el servicio ya no está PENDING', async () => {
      // Arrange
      const mockServicesUpdateManyTx = jest
        .fn()
        .mockResolvedValue({ count: 0 });
      const mockServiceRequestsUpdateTx = jest.fn();
      const mockBudgetOptionsUpdateTx = jest.fn();
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            services: { updateMany: mockServicesUpdateManyTx },
            serviceRequests: {
              update: mockServiceRequestsUpdateTx,
              updateMany: jest.fn(),
            },
            budgetOptions: {
              updateMany: jest.fn(),
              update: mockBudgetOptionsUpdateTx,
            },
          };
          return callback(txClient);
        },
      );

      // Act
      const result = await service.selectOptionTransaction(1, 10, 100, 5);

      // Assert
      expect(result).toBe(0);
      expect(mockServiceRequestsUpdateTx).not.toHaveBeenCalled();
      expect(mockBudgetOptionsUpdateTx).not.toHaveBeenCalled();
    });
  });
});
