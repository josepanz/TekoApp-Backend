/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request = require('supertest');
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { MemoryHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { AppModule } from './../src/app.module';
import { PrismaDatasource } from './../src/core/database/services/prisma.service';
import { RateLimitConfig } from './../src/core/config/rate-limit.config';

const mockPingCheck = jest
  .fn()
  .mockResolvedValue({ database: { status: 'up' } });

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  isConnected: true,
  extended: {},
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaDatasource)
      .useValue(mockPrisma)
      .overrideProvider(PrismaHealthIndicator)
      .useValue({ pingCheck: mockPingCheck })
      .overrideProvider(MemoryHealthIndicator)
      .useValue({
        checkHeap: jest
          .fn()
          .mockResolvedValue({ memory_heap: { status: 'up' } }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        validationError: { target: false },
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.enableVersioning({ type: VersioningType.URI });
    app.setGlobalPrefix('/tekoapp-backend/api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // `app.close()` cierra todo lo que Nest maneja vía DI (Mongoose, las colas de Bull, etc. —
    // cada uno con su propio hook de shutdown). `RateLimitConfig` guarda su cliente Redis en un
    // singleton estático a propósito (compartido entre `middleware.config.ts` y
    // `AppModule.configure()`, ver su comentario), así que vive fuera de esa DI y nada lo cierra
    // solo. Sin este cierre explícito, `pnpm run test:e2e` corría bien pero el proceso de Jest se
    // quedaba colgado esperando por esta conexión — ver también HealthController.onModuleDestroy,
    // que sí se resuelve solo porque ese cliente ahora está enganchado a la DI.
    await RateLimitConfig.closeRedisClient();
  });

  afterEach(() => jest.clearAllMocks());

  // El healthcheck es VERSION_NEUTRAL a propósito (HealthController, commit 7e22526 / I-04):
  // las 9 probes de K8s (ci/{develop,qa,master}/1_deployment.yml) y el health check de Render
  // (fuera del repo) pegan a /tekoapp-backend/api/healthcheck SIN /v1. Si algún día se le agrega
  // @Version('1') "para ser consistente con el resto", las probes dan 404, el pod nunca llega a
  // Ready y el deploy se cae con rollback. No cambiar este path a /v1 sin migrar antes las 9
  // probes + la config de Render.
  it('/tekoapp-backend/api/healthcheck (GET) responde por la ruta version-neutral', () => {
    // 200 si todos los indicadores de salud están up, 503 si alguno falla (ej. disco en esta
    // máquina) — cualquiera de los dos prueba que la ruta existe y responde. Lo que NO es
    // aceptable es 404: significaría que el ruteo version-neutral se rompió.
    return request(app.getHttpServer())
      .get('/tekoapp-backend/api/healthcheck')
      .then((res) => {
        expect([200, 503]).toContain(res.status);
      });
  });

  it('/tekoapp-backend/api/v1/healthcheck (GET) da 404 porque el healthcheck no vive bajo /v1', () => {
    return request(app.getHttpServer())
      .get('/tekoapp-backend/api/v1/healthcheck')
      .expect(404);
  });
});
