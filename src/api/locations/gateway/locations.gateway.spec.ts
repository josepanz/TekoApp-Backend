import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { LocationsGateway } from './locations.gateway';
import { LocationsService } from '../services/locations.service';

const mockVerifyAsync = jest.fn();
const mockResolveProfessionalIdByUserRef = jest.fn();
const mockUpdateLocation = jest.fn();

function buildClient(overrides: Record<string, unknown> = {}) {
  return {
    handshake: { auth: { token: 'a-real-token' }, headers: {} },
    data: {},
    join: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  } as never;
}

describe('LocationsGateway', () => {
  let gateway: LocationsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsGateway,
        {
          provide: LocationsService,
          useValue: {
            resolveProfessionalIdByUserRef: mockResolveProfessionalIdByUserRef,
            updateLocation: mockUpdateLocation,
          },
        },
        { provide: JwtService, useValue: { verifyAsync: mockVerifyAsync } },
      ],
    }).compile();

    gateway = module.get<LocationsGateway>(LocationsGateway);
    gateway.server = { emit: jest.fn() } as never;
  });

  afterEach(() => jest.clearAllMocks());

  describe('handleConnection', () => {
    it('debe resolver el professionalId del usuario conectado y unirlo a su sala', async () => {
      // Arrange
      mockVerifyAsync.mockResolvedValue({ sub: 'user-ref-1' });
      mockResolveProfessionalIdByUserRef.mockResolvedValue(42);
      const client = buildClient();

      // Act
      await gateway.handleConnection(client);

      // Assert
      expect((client.data as Record<string, unknown>).professionalId).toBe(42);
      expect(client.join).toHaveBeenCalledWith('professional:42');
    });

    it('debe permitir la conexión de un usuario sin perfil profesional, sin sala propia', async () => {
      // Arrange
      mockVerifyAsync.mockResolvedValue({ sub: 'user-ref-1' });
      mockResolveProfessionalIdByUserRef.mockRejectedValue(
        new Error('sin perfil'),
      );
      const client = buildClient();

      // Act
      await gateway.handleConnection(client);

      // Assert
      expect(client.disconnect).not.toHaveBeenCalled();
      expect(
        (client.data as Record<string, unknown>).professionalId,
      ).toBeUndefined();
    });

    it('debe desconectar si el token es inválido', async () => {
      // Arrange
      mockVerifyAsync.mockRejectedValue(new Error('token inválido'));
      const client = buildClient();

      // Act
      await gateway.handleConnection(client);

      // Assert
      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleUpdateLocation', () => {
    it('nunca confía en un professionalId mandado por el cliente — usa el resuelto en la conexión', async () => {
      // Arrange
      const client = buildClient({ data: { professionalId: 42 } });
      mockUpdateLocation.mockResolvedValue({ id: 42 });

      // Act
      const result = await gateway.handleUpdateLocation(
        { location: { latitude: -25.3, longitude: -57.6 } },
        client,
      );

      // Assert
      expect(mockUpdateLocation).toHaveBeenCalledWith(42, {
        latitude: -25.3,
        longitude: -57.6,
      });
      expect(result).toEqual({ success: true });
    });

    it('debe rechazar la actualización si el socket no resolvió un professionalId propio', async () => {
      // Arrange
      const client = buildClient({ data: {} });

      // Act
      const result = await gateway.handleUpdateLocation(
        { location: { latitude: -25.3, longitude: -57.6 } },
        client,
      );

      // Assert
      expect(mockUpdateLocation).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
    });
  });
});
