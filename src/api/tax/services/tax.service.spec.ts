import { Test, TestingModule } from '@nestjs/testing';
import { TaxDbService } from '@modules/tax-db/services/tax-db.service';
import { TaxService } from './tax.service';

const mockFindActiveConfig = jest.fn();

describe('TaxService', () => {
  let service: TaxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxService,
        {
          provide: TaxDbService,
          useValue: { findActiveConfig: mockFindActiveConfig },
        },
      ],
    }).compile();

    service = module.get<TaxService>(TaxService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getConfig', () => {
    it('debe retornar la config activa mapeada', async () => {
      // Arrange — los campos Decimal de Prisma ya llegan normalizados a `number` por el
      // `$extends` de PrismaDatasource (ver .claude/rules/typescript.md), nunca se mockea acá.
      mockFindActiveConfig.mockResolvedValue({
        id: 1,
        countryId: null,
        name: 'IVA Paraguay',
        rate: 0.1,
        isEnabled: true,
        isActive: true,
      });

      // Act
      const result = await service.getConfig();

      // Assert
      expect(result).toEqual({
        isEnabled: true,
        name: 'IVA Paraguay',
        rate: 0.1,
      });
      expect(mockFindActiveConfig).toHaveBeenCalledWith(null);
    });

    it('debe retornar el default deshabilitado cuando nunca se cargó ninguna config', async () => {
      // Arrange
      mockFindActiveConfig.mockResolvedValue(null);

      // Act
      const result = await service.getConfig();

      // Assert
      expect(result).toEqual({
        isEnabled: false,
        name: 'Sin configurar',
        rate: 0,
      });
    });
  });

  describe('calculateTax', () => {
    it('debe retornar 0 cuando no hay ninguna config cargada (default deshabilitado)', async () => {
      // Arrange
      mockFindActiveConfig.mockResolvedValue(null);

      // Act
      const result = await service.calculateTax(10000);

      // Assert
      expect(result).toBe(0);
    });

    it('debe retornar 0 cuando la config está deshabilitada aunque tenga una tasa cargada', async () => {
      // Arrange
      mockFindActiveConfig.mockResolvedValue({
        id: 1,
        countryId: null,
        name: 'IVA Paraguay',
        rate: 0.1,
        isEnabled: false,
        isActive: true,
      });

      // Act
      const result = await service.calculateTax(10000);

      // Assert
      expect(result).toBe(0);
    });

    it('debe calcular el monto de IVA sobre la comisión de plataforma cuando está habilitada', async () => {
      // Arrange
      mockFindActiveConfig.mockResolvedValue({
        id: 1,
        countryId: null,
        name: 'IVA Paraguay',
        rate: 0.1,
        isEnabled: true,
        isActive: true,
      });

      // Act
      const result = await service.calculateTax(10000);

      // Assert
      expect(result).toBe(1000);
    });
  });
});
