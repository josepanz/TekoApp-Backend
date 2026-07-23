import { Test, TestingModule } from '@nestjs/testing';
import { ServiceTypesService } from './service-types.service';
import { ServiceTypesDbService } from '@modules/service-types-db/services/service-types-db.service';

const mockFindAllActive = jest.fn();

describe('ServiceTypesService', () => {
  let service: ServiceTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceTypesService,
        {
          provide: ServiceTypesDbService,
          useValue: { findAllActive: mockFindAllActive },
        },
      ],
    }).compile();

    service = module.get<ServiceTypesService>(ServiceTypesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar los tipos de servicio activos', async () => {
      // Arrange
      const mockTypes = [{ id: 1, name: 'Instalación' }];
      mockFindAllActive.mockResolvedValue(mockTypes);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockTypes);
      expect(mockFindAllActive).toHaveBeenCalled();
    });
  });
});
