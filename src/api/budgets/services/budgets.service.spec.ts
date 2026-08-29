import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetLineItemType, RequestStatus } from '@prisma/client';
import { BudgetsService } from './budgets.service';
import { BudgetsDbService } from '@modules/budgets-db/services/budgets-db.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { MaterialCatalogDbService } from '@modules/material-catalog-db/services/material-catalog-db.service';

const mockFindByRequestId = jest.fn();
const mockFindByReferenceId = jest.fn();
const mockReplaceOptionsTransaction = jest.fn();
const mockSelectOptionTransaction = jest.fn();
const mockFindServiceByReferenceId = jest.fn();
const mockFindServiceRequestByReferenceId = jest.fn();
const mockFindProfessionalByUserId = jest.fn();
const mockFindManyByReferenceIds = jest.fn();

const SERVICE_REF = 'svc-1';
const REQUEST_REF = 'req-1';
const SERVICE_PK = 100;
const REQUEST_PK = 10;

const mockService = {
  id: SERVICE_PK,
  referenceId: SERVICE_REF,
  userId: 1,
  category: { maxBudgetOptionsPerRequest: 3 },
};

const mockRequest = {
  id: REQUEST_PK,
  referenceId: REQUEST_REF,
  professionalId: 5,
  status: RequestStatus.PENDING,
};

const mockProfessional = { id: 5, userId: 10 };

describe('BudgetsService', () => {
  let service: BudgetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: BudgetsDbService,
          useValue: {
            findByRequestId: mockFindByRequestId,
            findByReferenceId: mockFindByReferenceId,
            replaceOptionsTransaction: mockReplaceOptionsTransaction,
            selectOptionTransaction: mockSelectOptionTransaction,
          },
        },
        {
          provide: ServicesDbService,
          useValue: {
            findServiceByReferenceId: mockFindServiceByReferenceId,
            findServiceRequestByReferenceId:
              mockFindServiceRequestByReferenceId,
            findProfessionalByUserId: mockFindProfessionalByUserId,
          },
        },
        {
          provide: MaterialCatalogDbService,
          useValue: { findManyByReferenceIds: mockFindManyByReferenceIds },
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('replaceOptions', () => {
    beforeEach(() => {
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindServiceRequestByReferenceId.mockResolvedValue(mockRequest);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
    });

    it('debe recalcular subtotal/totalPrice server-side sin confiar en lo que manda el cliente', async () => {
      // Arrange
      mockFindManyByReferenceIds.mockResolvedValue([
        { id: 3, referenceId: 'catalog-1' },
      ]);
      mockReplaceOptionsTransaction.mockResolvedValue([]);
      const dto = {
        options: [
          {
            label: 'Estándar',
            lineItems: [
              {
                itemType: BudgetLineItemType.MATERIAL,
                catalogItemReferenceId: 'catalog-1',
                description: 'Cerámica',
                quantity: 10,
                unitPrice: 5000,
              },
            ],
          },
        ],
      };

      // Act
      await service.replaceOptions(
        SERVICE_REF,
        REQUEST_REF,
        dto,
        10,
        'prof-ref-1',
      );

      // Assert
      expect(mockReplaceOptionsTransaction).toHaveBeenCalledWith(
        REQUEST_PK,
        'prof-ref-1',
        [
          expect.objectContaining({
            label: 'Estándar',
            totalPrice: 50000,
            lineItems: [
              expect.objectContaining({ catalogItemId: 3, subtotal: 50000 }),
            ],
          }),
        ],
      );
    });

    it('debe lanzar ForbiddenException cuando quien llama no es el autor de la propuesta', async () => {
      // Arrange
      mockFindProfessionalByUserId.mockResolvedValue({ id: 999, userId: 20 });

      // Act & Assert
      await expect(
        service.replaceOptions(
          SERVICE_REF,
          REQUEST_REF,
          { options: [] },
          20,
          'prof-ref-1',
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockReplaceOptionsTransaction).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando la solicitud ya no está pendiente', async () => {
      // Arrange
      mockFindServiceRequestByReferenceId.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
      });

      // Act & Assert
      await expect(
        service.replaceOptions(
          SERVICE_REF,
          REQUEST_REF,
          { options: [] },
          10,
          'prof-ref-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException cuando se excede el máximo de opciones de la categoría', async () => {
      // Arrange
      const dto = {
        options: Array.from({ length: 4 }, (_, i) => ({
          label: `Opción ${i}`,
          lineItems: [
            {
              itemType: BudgetLineItemType.LABOR,
              description: 'Mano de obra',
              quantity: 1,
              unitPrice: 1000,
            },
          ],
        })),
      };

      // Act & Assert
      await expect(
        service.replaceOptions(SERVICE_REF, REQUEST_REF, dto, 10, 'prof-ref-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockReplaceOptionsTransaction).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando un catalogItemReferenceId no existe', async () => {
      // Arrange
      mockFindManyByReferenceIds.mockResolvedValue([]);
      const dto = {
        options: [
          {
            label: 'Estándar',
            lineItems: [
              {
                itemType: BudgetLineItemType.MATERIAL,
                catalogItemReferenceId: 'catalog-inexistente',
                description: 'Cerámica',
                quantity: 10,
                unitPrice: 5000,
              },
            ],
          },
        ],
      };

      // Act & Assert
      await expect(
        service.replaceOptions(SERVICE_REF, REQUEST_REF, dto, 10, 'prof-ref-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockReplaceOptionsTransaction).not.toHaveBeenCalled();
    });
  });

  describe('listOptions', () => {
    it('debe permitir al cliente dueño del servicio ver las opciones', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindServiceRequestByReferenceId.mockResolvedValue(mockRequest);
      mockFindProfessionalByUserId.mockResolvedValue(null);
      mockFindByRequestId.mockResolvedValue([]);

      // Act
      const result = await service.listOptions(SERVICE_REF, REQUEST_REF, 1);

      // Assert
      expect(result).toEqual({ data: [] });
    });

    it('debe lanzar ForbiddenException cuando quien pide no es ni el dueño ni el autor', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindServiceRequestByReferenceId.mockResolvedValue(mockRequest);
      mockFindProfessionalByUserId.mockResolvedValue({ id: 999, userId: 30 });

      // Act & Assert
      await expect(
        service.listOptions(SERVICE_REF, REQUEST_REF, 30),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('selectOption', () => {
    beforeEach(() => {
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindServiceRequestByReferenceId.mockResolvedValue(mockRequest);
    });

    it('debe lanzar ForbiddenException cuando quien selecciona no es el dueño del servicio', async () => {
      // Act & Assert
      await expect(
        service.selectOption(SERVICE_REF, REQUEST_REF, 'option-1', 999),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar NotFoundException cuando la opción no pertenece a la solicitud', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({
        id: 1,
        serviceRequestId: 999,
      });

      // Act & Assert
      await expect(
        service.selectOption(SERVICE_REF, REQUEST_REF, 'option-1', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException cuando el servicio ya no está disponible', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({
        id: 1,
        serviceRequestId: REQUEST_PK,
      });
      mockSelectOptionTransaction.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.selectOption(SERVICE_REF, REQUEST_REF, 'option-1', 1),
      ).rejects.toThrow(ConflictException);
    });

    it('debe retornar la opción seleccionada cuando la transacción tiene éxito', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({
        id: 1,
        serviceRequestId: REQUEST_PK,
      });
      mockSelectOptionTransaction.mockResolvedValue(1);
      mockFindByRequestId.mockResolvedValue([
        { referenceId: 'option-1', isSelected: true, lineItems: [] },
      ]);

      // Act
      const result = await service.selectOption(
        SERVICE_REF,
        REQUEST_REF,
        'option-1',
        1,
      );

      // Assert
      expect(result).toEqual(
        expect.objectContaining({ referenceId: 'option-1', isSelected: true }),
      );
      expect(mockSelectOptionTransaction).toHaveBeenCalledWith(
        1,
        REQUEST_PK,
        SERVICE_PK,
        mockRequest.professionalId,
      );
    });
  });
});
