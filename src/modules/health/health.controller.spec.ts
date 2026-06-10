import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
  MongooseHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

import { HealthController } from './health.controller';
import { PrismaDatasource } from '@core/database/services/prisma.service';

// ─── Mocks de dependencias ────────────────────────────────────────────────────

const mockHealthCheck = jest.fn();
const mockPrismaPingCheck = jest.fn();
const mockMongoosePingCheck = jest.fn();
const mockCheckHeap = jest.fn();
const mockCheckStorage = jest.fn();

// ─── Mock de ioredis ──────────────────────────────────────────────────────────

const mockRedisPing = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: mockRedisPing,
    quit: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: mockHealthCheck },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: { pingCheck: mockPrismaPingCheck },
        },
        {
          provide: MongooseHealthIndicator,
          useValue: { pingCheck: mockMongoosePingCheck },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: { checkHeap: mockCheckHeap },
        },
        {
          provide: DiskHealthIndicator,
          useValue: { checkStorage: mockCheckStorage },
        },
        {
          provide: PrismaDatasource,
          useValue: {},
        },
        {
          provide: getConnectionToken(),
          useValue: { readyState: 1 } as Partial<Connection>,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────────────────────────────────
  // check
  // ──────────────────────────────────────────────────────────────────────────

  describe('check', () => {
    it('debe retornar estado ok con fecha y versión cuando toda la infraestructura está disponible', async () => {
      // Arrange
      const healthResult = {
        status: 'ok',
        info: {
          postgres_database: { status: 'up' },
          mongodb_database: { status: 'up' },
          memory_heap: { status: 'up' },
          storage_disk: { status: 'up' },
        },
        error: {},
        details: {},
      };
      mockHealthCheck.mockResolvedValue(healthResult);
      mockRedisPing.mockResolvedValue('PONG');

      // Act
      const result = await controller.check();

      // Assert
      expect(result.status).toBe('ok');
      expect(result.info).toEqual(healthResult.info);
      expect(result.date).toBeDefined();
      expect(result.version).toBeDefined();
      expect(typeof result.version).toBe('string');
    });

    it('debe invocar health.check con los 5 indicadores de infraestructura', async () => {
      // Arrange
      mockHealthCheck.mockResolvedValue({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      });
      mockRedisPing.mockResolvedValue('PONG');

      // Act
      await controller.check();

      // Assert
      expect(mockHealthCheck).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
        ]),
      );
      const firstCallArgs = mockHealthCheck.mock.calls[0] as [
        Array<() => Promise<unknown>>,
        ...unknown[],
      ];
      expect(firstCallArgs[0]).toHaveLength(5);
    });

    it('debe retornar estado error cuando uno de los indicadores falla', async () => {
      // Arrange
      const degradedResult = {
        status: 'error',
        info: { postgres_database: { status: 'up' } },
        error: { mongodb_database: { status: 'down', message: 'Timeout' } },
        details: {},
      };
      mockHealthCheck.mockResolvedValue(degradedResult);
      mockRedisPing.mockResolvedValue('PONG');

      // Act
      const result = await controller.check();

      // Assert
      expect(result.status).toBe('error');
      expect(result.error).toEqual(degradedResult.error);
    });

    it('debe incluir la fecha ajustada a la zona horaria de Asuncion', async () => {
      // Arrange
      mockHealthCheck.mockResolvedValue({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      });
      mockRedisPing.mockResolvedValue('PONG');

      // Act
      const result = await controller.check();

      // Assert: la fecha debe ser un objeto Date válido
      expect(result.date).toBeInstanceOf(Date);
    });

    it('debe ejecutar la verificación de Redis como parte de los checks', async () => {
      // Arrange
      mockHealthCheck.mockImplementation(
        async (checks: Array<() => Promise<unknown>>) => {
          // Ejecutar el tercer check (Redis) directamente
          const redisCheck = checks[2];
          await redisCheck();
          return { status: 'ok', info: {}, error: {}, details: {} };
        },
      );
      mockRedisPing.mockResolvedValue('PONG');

      // Act
      await controller.check();

      // Assert
      expect(mockRedisPing).toHaveBeenCalled();
    });
  });
});
