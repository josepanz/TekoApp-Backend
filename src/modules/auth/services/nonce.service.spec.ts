import { Test, TestingModule } from '@nestjs/testing';
import { NonceService } from './nonce.service';
import { NONCE_REDIS_CLIENT } from '@modules/auth/constants';

// ─── Mock del cliente Redis (ioredis) ─────────────────────────────────────────

const mockSet = jest.fn();
const mockGetDel = jest.fn();
const mockDisconnect = jest.fn();

describe('NonceService', () => {
  let service: NonceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NonceService,
        {
          provide: NONCE_REDIS_CLIENT,
          useValue: {
            set: mockSet,
            getdel: mockGetDel,
            disconnect: mockDisconnect,
          },
        },
      ],
    }).compile();

    service = module.get<NonceService>(NonceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('issue', () => {
    it('debe generar un nonce hex de 32 caracteres y persistirlo con TTL de 60s', async () => {
      // Arrange
      mockSet.mockResolvedValue('OK');

      // Act
      const nonce = await service.issue();

      // Assert
      expect(nonce).toMatch(/^[0-9a-f]{32}$/);
      expect(mockSet).toHaveBeenCalledWith(`nonce:${nonce}`, '1', 'EX', 60);
    });
  });

  describe('consume', () => {
    it('debe retornar true y borrar el nonce cuando existía (GETDEL devuelve valor)', async () => {
      // Arrange
      mockGetDel.mockResolvedValue('1');

      // Act
      const result = await service.consume('abc123');

      // Assert
      expect(result).toBe(true);
      expect(mockGetDel).toHaveBeenCalledWith('nonce:abc123');
    });

    it('debe retornar false cuando el nonce no existe (nunca emitido, usado o expirado)', async () => {
      // Arrange
      mockGetDel.mockResolvedValue(null);

      // Act
      const result = await service.consume('inexistente');

      // Assert
      expect(result).toBe(false);
    });

    it('debe retornar false sin consultar Redis cuando el nonce es vacío', async () => {
      // Act
      const result = await service.consume('');

      // Assert
      expect(result).toBe(false);
      expect(mockGetDel).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('debe desconectar el cliente Redis', () => {
      // Act
      service.onModuleDestroy();

      // Assert
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
