// api/health/health.controller.ts
import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
  MongooseHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { toZonedTime } from 'date-fns-tz';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import * as path from 'path';
import * as fs from 'fs';

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
) as PackageJson;

@ApiTags('Healthcheck')
@Controller('healthcheck')
export class HealthController {
  private readonly redisClient: Redis;

  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly mongooseIndicator: MongooseHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
    private readonly diskIndicator: DiskHealthIndicator,
    private readonly prismaDataSource: PrismaDatasource,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {
    // Inicialización de cliente aislado para chequeo de salud de Redis
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
      maxRetriesPerRequest: 1,
    });
  }

  @Get()
  @HealthCheck()
  @Version('1')
  @ApiOperation({
    summary:
      'Verifica el estado de salud global de la infraestructura de TekoApp',
  })
  async check() {
    const result = await this.health.check([
      // 1. Base de datos Relacional (PostgreSQL via Prisma)
      () =>
        this.prismaIndicator.pingCheck(
          'postgres_database',
          this.prismaDataSource,
        ),

      // 2. Base de datos NoSQL (MongoDB via Mongoose)
      () =>
        this.mongooseIndicator.pingCheck('mongodb_database', {
          connection: this.mongoConnection,
        }),

      // 3. Cache y colas (Redis Server)
      async () => {
        try {
          const pong = await this.redisClient.ping();
          return { redis: { status: pong === 'PONG' ? 'up' : 'down' } };
        } catch (error: any) {
          return { redis: { status: 'down', message: error.message } };
        }
      },

      // 4. Consumo de Memoria Heap (Límite adaptado para microservicios de 250MB)
      () => this.memoryIndicator.checkHeap('memory_heap', 250 * 1024 * 1024),

      // 5. Espacio de almacenamiento en Disco (Alerta si supera el 90% de ocupación)
      () =>
        this.diskIndicator.checkStorage('storage_disk', {
          thresholdPercent: 0.9,
          path: process.platform === 'win32' ? 'c:' : '/',
        }),
    ]);

    return {
      date: toZonedTime(new Date(), 'America/Asuncion'),
      status: result.status,
      info: result.info,
      error: result.error,
      version: packageJson.version,
    };
  }
}
