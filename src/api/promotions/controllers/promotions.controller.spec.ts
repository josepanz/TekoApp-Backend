import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PromotionsController } from '@api/promotions/controllers/promotions.controller';
import { PromotionsService } from '@api/promotions/services/promotions.service';
import { CreatePromotionRequestDTO } from '@api/promotions/dtos/request/create-promotion.request.dto';
import { ApplyPromotionRequestDTO } from '@api/promotions/dtos/request/apply-promotion.request.dto';
import { PromotionIdParamDTO } from '@api/promotions/dtos/request/promotion-id.param.dto';
import { ValidatePromotionRequestDTO } from '@api/promotions/dtos/request/validate-promotion.request.dto';
import {
  PromotionDetailResponseDTO,
  PromotionApplyResponseDTO,
  PromotionValidateResponseDTO,
  PromotionStatsResponseDTO,
} from '@api/promotions/dtos/response';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';

// --- Mocks nivel módulo ---
const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockFindActive = jest.fn();
const mockGetPromotionStats = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
const mockValidatePromotion = jest.fn();
const mockApplyPromotion = jest.fn();

const mockUser = {
  id: 1,
  email: 'admin@example.com',
  referenceId: 'ref-uuid',
  role: 'PROFESSIONAL',
  firstName: 'Admin',
  lastName: 'User',
  accessLevelId: 1,
  userStatus: 'ACTIVE',
  profileStatus: 'COMPLETE',
  permissions: [],
  roles: [],
} as unknown as IUserDataOnJwt & { role?: string };

describe('PromotionsController', () => {
  let controller: PromotionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [
        {
          provide: PromotionsService,
          useValue: {
            create: mockCreate,
            findAll: mockFindAll,
            findActive: mockFindActive,
            getPromotionStats: mockGetPromotionStats,
            findOne: mockFindOne,
            update: mockUpdate,
            remove: mockRemove,
            validatePromotion: mockValidatePromotion,
            applyPromotion: mockApplyPromotion,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PromotionsController>(PromotionsController);
  });

  afterEach(() => jest.clearAllMocks());

  // ==================== create ====================
  describe('create', () => {
    it('debe crear una promoción y retornar su detalle', async () => {
      // Arrange
      const dto: CreatePromotionRequestDTO = {
        code: 'PROMO10',
        name: '10% off',
      } as unknown as CreatePromotionRequestDTO;
      const expected: PromotionDetailResponseDTO = {
        id: 'promo-1',
        code: 'PROMO10',
      } as unknown as PromotionDetailResponseDTO;
      mockCreate.mockResolvedValue(expected);

      // Act
      const result = await controller.create(dto, { user: mockUser });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toBe(expected);
    });
  });

  // ==================== findAll ====================
  describe('findAll', () => {
    it('debe retornar todas las promociones existentes', async () => {
      // Arrange
      const expected: PromotionDetailResponseDTO[] = [
        { id: 'promo-1' } as unknown as PromotionDetailResponseDTO,
        { id: 'promo-2' } as unknown as PromotionDetailResponseDTO,
      ];
      mockFindAll.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockFindAll).toHaveBeenCalledTimes(1);
      expect(result).toBe(expected);
    });
  });

  // ==================== findActive ====================
  describe('findActive', () => {
    it('debe retornar solo las promociones activas vigentes', async () => {
      // Arrange
      const expected: PromotionDetailResponseDTO[] = [
        {
          id: 'promo-1',
          status: 'ACTIVE',
        } as unknown as PromotionDetailResponseDTO,
      ];
      mockFindActive.mockResolvedValue(expected);

      // Act
      const result = await controller.findActive();

      // Assert
      expect(mockFindActive).toHaveBeenCalledTimes(1);
      expect(result).toBe(expected);
    });
  });

  // ==================== getStats ====================
  describe('getStats', () => {
    it('debe retornar las estadísticas globales de promociones', async () => {
      // Arrange
      const expected: PromotionStatsResponseDTO = {
        totalPromotions: 10,
        activePromotions: 5,
        totalUsage: 100,
        totalDiscount: 5000,
      };
      mockGetPromotionStats.mockResolvedValue(expected);

      // Act
      const result = await controller.getStats();

      // Assert
      expect(mockGetPromotionStats).toHaveBeenCalledTimes(1);
      expect(result).toBe(expected);
    });
  });

  // ==================== findOne ====================
  describe('findOne', () => {
    it('debe retornar el detalle de una promoción por ID', async () => {
      // Arrange
      const param: PromotionIdParamDTO = {
        id: 'promo-1',
      };
      const expected: PromotionDetailResponseDTO = {
        id: 'promo-1',
      } as unknown as PromotionDetailResponseDTO;
      mockFindOne.mockResolvedValue(expected);

      // Act
      const result = await controller.findOne(param);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(param.id);
      expect(result).toBe(expected);
    });
  });

  // ==================== update ====================
  describe('update', () => {
    it('debe actualizar los datos de una promoción y retornar el detalle actualizado', async () => {
      // Arrange
      const param: PromotionIdParamDTO = {
        id: 'promo-1',
      };
      const dto: Partial<CreatePromotionRequestDTO> = {
        name: 'Nuevo nombre',
      };
      const expected: PromotionDetailResponseDTO = {
        id: 'promo-1',
        name: 'Nuevo nombre',
      } as unknown as PromotionDetailResponseDTO;
      mockUpdate.mockResolvedValue(expected);

      // Act
      const result = await controller.update(param, dto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(param.id, dto);
      expect(result).toBe(expected);
    });
  });

  // ==================== remove ====================
  describe('remove', () => {
    it('debe desactivar una promoción y retornar el detalle con estado inactivo', async () => {
      // Arrange
      const param: PromotionIdParamDTO = {
        id: 'promo-1',
      };
      const expected: PromotionDetailResponseDTO = {
        id: 'promo-1',
        status: 'INACTIVE',
      } as unknown as PromotionDetailResponseDTO;
      mockRemove.mockResolvedValue(expected);

      // Act
      const result = await controller.remove(param);

      // Assert
      expect(mockRemove).toHaveBeenCalledWith(param.id);
      expect(result).toBe(expected);
    });
  });

  // ==================== validatePromotion ====================
  describe('validatePromotion', () => {
    it('debe validar un código de promoción y retornar si es válido con el monto de descuento', async () => {
      // Arrange
      const dto: ValidatePromotionRequestDTO = {
        code: 'PROMO10',
        serviceAmount: 200,
      };
      const expected: PromotionValidateResponseDTO = {
        isValid: true,
        discountAmount: 20,
      };
      mockValidatePromotion.mockResolvedValue(expected);

      // Act
      const result = await controller.validatePromotion(dto, {
        user: mockUser,
      });

      // Assert
      expect(mockValidatePromotion).toHaveBeenCalledWith(
        dto.code,
        mockUser.id,
        mockUser.role,
        dto.serviceAmount,
      );
      expect(result).toBe(expected);
    });

    it('debe pasar string vacío como userType cuando el rol del usuario no está definido', async () => {
      // Arrange
      const userSinRol = {
        id: 2,
        email: 'u@u.com',
        referenceId: 'r',
        role: undefined,
      } as unknown as IUserDataOnJwt & { role?: string };
      const dto: ValidatePromotionRequestDTO = {
        code: 'PROMO10',
        serviceAmount: 100,
      };
      const expected: PromotionValidateResponseDTO = {
        isValid: false,
        discountAmount: 0,
        message: 'No disponible',
      };
      mockValidatePromotion.mockResolvedValue(expected);

      // Act
      const result = await controller.validatePromotion(dto, {
        user: userSinRol,
      });

      // Assert
      expect(mockValidatePromotion).toHaveBeenCalledWith(
        dto.code,
        userSinRol.id,
        '',
        dto.serviceAmount,
      );
      expect(result).toBe(expected);
    });
  });

  // ==================== applyPromotion ====================
  describe('applyPromotion', () => {
    it('debe aplicar una promoción y retornar el monto final con el descuento', async () => {
      // Arrange
      const dto: ApplyPromotionRequestDTO = {
        promotionCode: 'PROMO10',
        serviceAmount: 200,
        serviceId: 'srv-1',
      };
      const expected: PromotionApplyResponseDTO = {
        success: true,
        discountAmount: 20,
        finalAmount: 180,
        message: 'Promoción aplicada. Descuento: 20',
      };
      mockApplyPromotion.mockResolvedValue(expected);

      // Act
      const result = await controller.applyPromotion(dto, { user: mockUser });

      // Assert
      expect(mockApplyPromotion).toHaveBeenCalledWith({
        ...dto,
        userId: mockUser.id,
        userType: mockUser.role,
      });
      expect(result).toBe(expected);
    });

    it('debe pasar string vacío como userType al aplicar cuando el usuario no tiene rol', async () => {
      // Arrange
      const userSinRol = {
        id: 3,
        email: 'x@x.com',
        referenceId: 'r2',
        role: undefined,
      } as unknown as IUserDataOnJwt & { role?: string };
      const dto: ApplyPromotionRequestDTO = {
        promotionCode: 'PROMO10',
        serviceAmount: 100,
      };
      const expected: PromotionApplyResponseDTO = {
        success: false,
        discountAmount: 0,
        finalAmount: 100,
        message: 'No válido',
      };
      mockApplyPromotion.mockResolvedValue(expected);

      // Act
      await controller.applyPromotion(dto, { user: userSinRol });

      // Assert
      expect(mockApplyPromotion).toHaveBeenCalledWith(
        expect.objectContaining({ userId: userSinRol.id, userType: '' }),
      );
    });
  });
});
