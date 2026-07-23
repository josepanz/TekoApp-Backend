import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsRepository } from './credentials.repository';
import { PrismaDatasource } from '@core/database/services/prisma.service';

// ─── Mocks de Prisma (cliente extendido + transacción) ────────────────────────

const mockTxUpdateMany = jest.fn();
const mockTxCreate = jest.fn();
const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();

const mockTx = {
  userCredentials: {
    updateMany: mockTxUpdateMany,
    create: mockTxCreate,
  },
};

// Ejecuta el callback de la transacción con el tx mockeado.
const mockTransaction = jest.fn((cb: (tx: typeof mockTx) => unknown) =>
  cb(mockTx),
);

describe('CredentialsRepository', () => {
  let repository: CredentialsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsRepository,
        {
          provide: PrismaDatasource,
          useValue: {
            extended: {
              $transaction: mockTransaction,
              userCredentials: {
                findFirst: mockFindFirst,
                findMany: mockFindMany,
                update: mockUpdate,
              },
            },
          },
        },
      ],
    }).compile();

    repository = module.get<CredentialsRepository>(CredentialsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('rotatePassword', () => {
    it('debe desactivar las credenciales activas e insertar una nueva fila activa dentro de una transacción', async () => {
      // Arrange
      const created = { id: 99, userId: 10, isActive: true };
      mockTxUpdateMany.mockResolvedValue({ count: 1 });
      mockTxCreate.mockResolvedValue(created);

      // Act
      const result = await repository.rotatePassword(10, 'new_hash');

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTxUpdateMany).toHaveBeenCalledWith({
        where: { userId: 10, isActive: true },
        data: { isActive: false },
      });
      expect(mockTxCreate).toHaveBeenCalledWith({
        data: {
          userId: 10,
          passwordHash: 'new_hash',
          attempts: 0,
          isActive: true,
          expiredAt: null,
        },
      });
      expect(result).toBe(created);
    });

    it('debe insertar la nueva fila con el expiredAt recibido cuando se pasa una fecha', async () => {
      // Arrange
      const expiredAt = new Date('2030-01-01T00:00:00.000Z');
      const created = { id: 100, userId: 10, isActive: true, expiredAt };
      mockTxUpdateMany.mockResolvedValue({ count: 1 });
      mockTxCreate.mockResolvedValue(created);

      // Act
      const result = await repository.rotatePassword(10, 'new_hash', expiredAt);

      // Assert
      expect(mockTxCreate).toHaveBeenCalledWith({
        data: {
          userId: 10,
          passwordHash: 'new_hash',
          attempts: 0,
          isActive: true,
          expiredAt,
        },
      });
      expect(result).toBe(created);
    });
  });

  describe('findRecentByUserId', () => {
    it('debe devolver las últimas N credenciales del usuario (activas e inactivas) ordenadas por fecha desc', async () => {
      // Arrange
      const credenciales = [
        { id: 3, userId: 10, isActive: true },
        { id: 2, userId: 10, isActive: false },
      ];
      mockFindMany.mockResolvedValue(credenciales);

      // Act
      const result = await repository.findRecentByUserId(10, 5);

      // Assert
      expect(result).toBe(credenciales);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 10 },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });

  describe('findByUserId', () => {
    it('debe buscar la credencial activa más reciente del usuario', async () => {
      // Arrange
      const credential = { id: 1, userId: 10, isActive: true };
      mockFindFirst.mockResolvedValue(credential);

      // Act
      const result = await repository.findByUserId(10);

      // Assert
      expect(result).toBe(credential);
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { userId: 10, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
