import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BasicAuthGuard } from '@modules/auth/guards/basic-auth.guard';
import { OnboardingController } from './onboarding.controller';
import { OnboardingApiService } from '@api/onboarding/services/onboarding-api.service';
import * as DTO from '@api/onboarding/dtos';

// ── mocks de nivel de módulo ─────────────────────────────────────────────────
const mockOnboarding = jest.fn();

describe('OnboardingController', () => {
  let controller: OnboardingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        {
          provide: OnboardingApiService,
          useValue: { onboarding: mockOnboarding },
        },
      ],
    })
      .overrideGuard(BasicAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<OnboardingController>(OnboardingController);
  });

  afterEach(() => jest.clearAllMocks());

  // ── onboarding ────────────────────────────────────────────────────────────
  describe('onboarding', () => {
    it('debe registrar el usuario y retornar el DTO de respuesta con referenceId', async () => {
      // Arrange
      const dto: DTO.OnboardingUserRequestDTO = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan@example.com',
        phoneNumber: '+595981000000',
        password: 'encrypted_password',
        confirmPassword: 'encrypted_password',
        acceptTerms: true,
      };

      const expected: DTO.OnboardingUserResponseDTO = {
        referenceId: 'ref-abc-123',
        email: 'juan@example.com',
        status: 'ACTIVE',
      };

      mockOnboarding.mockResolvedValue(expected);

      // Act
      const result = await controller.onboarding(dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockOnboarding).toHaveBeenCalledWith(dto);
    });

    it('debe propagar BadRequestException cuando las contraseñas no coinciden', async () => {
      // Arrange
      const dto: DTO.OnboardingUserRequestDTO = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan@example.com',
        phoneNumber: '+595981000000',
        password: 'encrypted_pass1',
        confirmPassword: 'encrypted_pass2',
        acceptTerms: true,
      };

      mockOnboarding.mockRejectedValue(
        new BadRequestException('Las contraseñas no coinciden.'),
      );

      // Act & Assert
      await expect(controller.onboarding(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe pasar el DTO completo al servicio sin modificaciones', async () => {
      // Arrange
      const dto: DTO.OnboardingUserRequestDTO = {
        firstName: 'Maria',
        lastName: 'Lopez',
        email: 'maria@example.com',
        phoneNumber: '+595981111111',
        password: 'enc_pwd',
        confirmPassword: 'enc_pwd',
        acceptTerms: true,
      };

      mockOnboarding.mockResolvedValue({
        referenceId: 'ref-xyz',
        email: 'maria@example.com',
        status: 'PENDING',
      });

      // Act
      await controller.onboarding(dto);

      // Assert
      expect(mockOnboarding).toHaveBeenCalledTimes(1);
      expect(mockOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'maria@example.com',
          firstName: 'Maria',
        }),
      );
    });
  });
});
