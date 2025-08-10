import { ConfigService } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export class RedisConfig {
  static getBullConfig(configService: ConfigService): BullModuleOptions {
    return {
      redis: {
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD'),
        db: configService.get<number>('REDIS_DB', 0),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    };
  }
}
