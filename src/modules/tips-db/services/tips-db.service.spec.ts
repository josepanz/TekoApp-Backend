import { Test, TestingModule } from '@nestjs/testing';
import { TipMode } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { TipsDbService } from './tips-db.service';

const mockTipsFindUnique = jest.fn();
const mockTipsCreate = jest.fn();
const mockTipConfigFindFirst = jest.fn();

const mockPrisma = {
  extended: {
    tips: {
      findUnique: mockTipsFindUnique,
      create: mockTipsCreate,
    },
    tipConfig: {
      findFirst: mockTipConfigFindFirst,
    },
  },
};

describe('TipsDbService', () => {
  let service: TipsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TipsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TipsDbService>(TipsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByPaymentId', () => {
    it('debe buscar la propina por el id interno del pago', async () => {
      // Arrange
      const tip = { id: 1, paymentId: 10, mode: TipMode.FIXED };
      mockTipsFindUnique.mockResolvedValue(tip);

      // Act
      const result = await service.findByPaymentId(10);

      // Assert
      expect(result).toEqual(tip);
      expect(mockTipsFindUnique).toHaveBeenCalledWith({
        where: { paymentId: 10 },
      });
    });

    it('debe retornar null cuando el pago todavía no tiene propina', async () => {
      // Arrange
      mockTipsFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByPaymentId(10);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('debe crear la propina con los datos provistos', async () => {
      // Arrange
      const data = {
        paymentId: 10,
        userId: 1,
        professionalId: 5,
        mode: TipMode.PERCENTAGE,
        amount: 15000,
        currencyCode: 'PYG',
      };
      const created = { id: 1, referenceId: 'tip-uuid-1', ...data };
      mockTipsCreate.mockResolvedValue(created);

      // Act
      const result = await service.create(data);

      // Assert
      expect(result).toEqual(created);
      expect(mockTipsCreate).toHaveBeenCalledWith({ data });
    });
  });

  describe('findActiveConfig', () => {
    it('debe resolver la config activa más reciente para el país dado', async () => {
      // Arrange
      const config = { id: 1, countryId: null, isEnabled: true };
      mockTipConfigFindFirst.mockResolvedValue(config);

      // Act
      const result = await service.findActiveConfig(null);

      // Assert
      expect(result).toEqual(config);
      expect(mockTipConfigFindFirst).toHaveBeenCalledWith({
        where: { countryId: null, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('debe retornar null cuando nunca se cargó ninguna config', async () => {
      // Arrange
      mockTipConfigFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findActiveConfig();

      // Assert
      expect(result).toBeNull();
    });
  });
});
