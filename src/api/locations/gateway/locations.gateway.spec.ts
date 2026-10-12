import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from '@auth/guards/ws-jwt.guard';
import { LocationsGateway } from './locations.gateway';
import { LocationsService } from '../services/locations.service';

const mockVerifyAsync = jest.fn();
const mockResolveProfessionalIdByUserRef = jest.fn();
const mockUpdateLocation = jest.fn();
const mockCanViewExactLocation = jest.fn();
const mockApproximate = jest.fn();

function buildClient(overrides: Record<string, unknown> = {}) {
  return {
    handshake: { auth: { token: 'a-real-token' }, headers: {} },
    data: {},
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  } as never;
}

describe('LocationsGateway', () => {
  let gateway: LocationsGateway;
  let toEmit: jest.Mock;
  let serverEmit: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsGateway,
        {
          provide: LocationsService,
          useValue: {
            resolveProfessionalIdByUserRef: mockResolveProfessionalIdByUserRef,
            updateLocation: mockUpdateLocation,
            canViewExactLocation: mockCanViewExactLocation,
            approximate: mockApproximate,
          },
        },
        { provide: JwtService, useValue: { verifyAsync: mockVerifyAsync } },
      ],
    }).compile();

    gateway = module.get<LocationsGateway>(LocationsGateway);
    toEmit = jest.fn();
    serverEmit = jest.fn();
    gateway.server = {
      emit: serverEmit,
      to: jest.fn().mockReturnValue({ emit: toEmit }),
    } as never;
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
      mockUpdateLocation.mockResolvedValue({ id: 42, isOnline: true });
      mockApproximate.mockReturnValue({ latitude: -25.31, longitude: -57.61 });

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
      // Canal global: solo aproximada. Canal exacto: solo la sala del profesional.
      expect(serverEmit).toHaveBeenCalledWith(
        'locationUpdated',
        expect.objectContaining({
          location: expect.objectContaining({
            latitude: -25.31,
            longitude: -57.61,
          }) as unknown,
        }),
      );
      expect(toEmit).toHaveBeenCalledWith(
        'exactLocationUpdated',
        expect.anything(),
      );
    });

    it('no difunde por el canal global si el profesional no esta en linea', async () => {
      const client = buildClient({ data: { professionalId: 42 } });
      mockUpdateLocation.mockResolvedValue({ id: 42, isOnline: false });
      await gateway.handleUpdateLocation(
        { location: { latitude: -25.3, longitude: -57.6 } },
        client,
      );
      expect(serverEmit).not.toHaveBeenCalled();
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

  describe('handleSubscribeToProfessional', () => {
    const clientWithUser = () =>
      buildClient({ data: { user: { sub: 'user-ref-1' } } });

    it('hace join y confirma cuando la regla de ubicacion exacta se cumple (propio/admin/servicio activo)', async () => {
      mockCanViewExactLocation.mockResolvedValue(true);
      const client = clientWithUser();
      await gateway.handleSubscribeToProfessional(
        { professionalId: '5' },
        client,
      );
      expect(mockCanViewExactLocation).toHaveBeenCalledWith('user-ref-1', 5);
      expect(client.join).toHaveBeenCalledWith('professional:5');
      expect(client.emit).toHaveBeenCalledWith(
        'subscriptionConfirmed',
        expect.anything(),
      );
    });

    it('emite error y NO hace join si no cumple la regla', async () => {
      mockCanViewExactLocation.mockResolvedValue(false);
      const client = clientWithUser();
      await gateway.handleSubscribeToProfessional(
        { professionalId: '5' },
        client,
      );
      expect(client.join).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith(
        'subscriptionError',
        expect.anything(),
      );
    });

    it('rechaza un professionalId no numerico sin consultar permisos', async () => {
      const client = clientWithUser();
      await gateway.handleSubscribeToProfessional(
        { professionalId: 'abc' },
        client,
      );
      expect(mockCanViewExactLocation).not.toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('subscribe y unsubscribe tienen WsJwtGuard', () => {
      for (const name of [
        'handleSubscribeToProfessional',
        'handleUnsubscribeFromProfessional',
      ]) {
        const method = Object.getOwnPropertyDescriptor(
          LocationsGateway.prototype,
          name,
        )?.value as object;
        const guards = Reflect.getMetadata('__guards__', method) as unknown[];
        expect(guards).toContain(WsJwtGuard);
      }
    });
  });
});
