import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OnboardingApiService } from '@api/onboarding/services/onboarding-api.service';
import { OnboardingService } from '@modules/onboarding/services/onboarding.service';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { OnboardingUserRequestDTO } from '@api/onboarding/dtos/request/onboarding-user.request.dto';
import { UserStatus } from '@prisma/client';

// --- Mocks nivel módulo ---
const mockRegisterUser = jest.fn();

describe('OnboardingApiService', () => {
  let service: OnboardingApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingApiService,
        {
          provide: OnboardingService,
          useValue: {
            registerUser: mockRegisterUser,
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingApiService>(OnboardingApiService);
  });

  afterEach(() => jest.clearAllMocks());

  // ==================== onboarding ====================
  describe('onboarding', () => {
    const encryptedPassword = 'dGVzdA=='; // base64 de "test"
    const encryptedConfirm = 'dGVzdA==';
    const decryptedPassword = 'MiContraseña123!';

    const dto: OnboardingUserRequestDTO = {
      firstName: 'Juan',
      lastName: 'Perez',
      email: 'juan@example.com',
      phoneNumber: '0981234567',
      password: encryptedPassword,
      confirmPassword: encryptedConfirm,
      acceptTerms: true,
    };

    it('debe registrar un usuario nuevo y retornar referenceId, email y status', async () => {
      // Arrange
      jest
        .spyOn(CryptoHelper, 'decrypt')
        .mockReturnValue(Buffer.from(decryptedPassword));
      mockRegisterUser.mockResolvedValue({
        referenceId: 'uuid-ref-1',
        email: dto.email,
        status: UserStatus.PENDING_VERIFICATION,
      });

      // Act
      const result = await service.onboarding(dto);

      // Assert
      expect(mockRegisterUser).toHaveBeenCalledWith({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        password: decryptedPassword,
        acceptedTerms: dto.acceptTerms,
      });
      expect(result).toEqual({
        referenceId: 'uuid-ref-1',
        email: dto.email,
        status: UserStatus.PENDING_VERIFICATION,
      });
    });

    it('debe lanzar BadRequestException cuando las contraseñas desencriptadas no coinciden', async () => {
      // Arrange
      jest
        .spyOn(CryptoHelper, 'decrypt')
        .mockReturnValueOnce(Buffer.from('contraseña1'))
        .mockReturnValueOnce(Buffer.from('contraseña2'));

      // Act — guardar la promesa para reutilizarla en ambas aserciones
      const promise = service.onboarding(dto);

      // Assert
      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Las contraseñas no coinciden.');
      expect(mockRegisterUser).not.toHaveBeenCalled();
    });

    it('debe llamar a decrypt con algoritmo sha256 para ambas contraseñas', async () => {
      // Arrange
      const decryptSpy = jest
        .spyOn(CryptoHelper, 'decrypt')
        .mockReturnValue(Buffer.from(decryptedPassword));
      mockRegisterUser.mockResolvedValue({
        referenceId: 'uuid-ref-2',
        email: dto.email,
        status: UserStatus.PENDING_VERIFICATION,
      });

      // Act
      await service.onboarding(dto);

      // Assert
      expect(decryptSpy).toHaveBeenCalledTimes(2);
      expect(decryptSpy).toHaveBeenCalledWith(dto.password, 'sha256');
      expect(decryptSpy).toHaveBeenCalledWith(dto.confirmPassword, 'sha256');
    });

    it('debe propagar errores del servicio de onboarding al llamador', async () => {
      // Arrange
      jest
        .spyOn(CryptoHelper, 'decrypt')
        .mockReturnValue(Buffer.from(decryptedPassword));
      const serviceError = new Error('Error interno del servicio');
      mockRegisterUser.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(service.onboarding(dto)).rejects.toThrow(serviceError);
    });

    it('debe mapear únicamente referenceId, email y status al DTO de respuesta', async () => {
      // Arrange
      jest
        .spyOn(CryptoHelper, 'decrypt')
        .mockReturnValue(Buffer.from(decryptedPassword));
      const userFromService = {
        id: 99,
        referenceId: 'uuid-ref-3',
        email: dto.email,
        status: UserStatus.PENDING_VERIFICATION,
        firstName: 'Juan',
        lastName: 'Perez',
        passwordHash: 'hash-secreto',
      };
      mockRegisterUser.mockResolvedValue(userFromService);

      // Act
      const result = await service.onboarding(dto);

      // Assert
      expect(result).toEqual({
        referenceId: userFromService.referenceId,
        email: userFromService.email,
        status: userFromService.status,
      });
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
