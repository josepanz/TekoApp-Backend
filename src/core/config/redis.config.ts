// src/core/config/redis.config.ts
import { ConfigService } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export const getBullConfig = (
  configService: ConfigService,
): BullModuleOptions => {
  const redisConfig = configService.get('config.redis');

  return {
    redis: {
      host: redisConfig?.host ?? 'localhost',
      port: redisConfig?.port ?? 6379,
      password: redisConfig?.password,
      db: redisConfig?.queueDb ?? 0, // DB dedicada para colas de Bull
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
      timeout: 30000,
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 30000,
    },
  };
};
