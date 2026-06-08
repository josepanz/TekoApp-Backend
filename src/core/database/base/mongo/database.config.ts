import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { BullModuleOptions } from '@nestjs/bull';

export const getMongooseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  // Extraemos las variables usando tu namespace estructurado 'config'
  const mongodbUri = configService.get<string>('config.database.mongodbUri');
  const maxPoolSize = configService.get<number>(
    'config.database.mongodbMaxPoolSize',
  );
  const isDev = configService.get<string>('config.env') === 'development';

  return {
    uri: mongodbUri,
    maxPoolSize: maxPoolSize ?? 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    autoIndex: isDev,
  };
};

export const getBullConfig = (
  configService: ConfigService,
): BullModuleOptions => {
  const redisConfig = configService.get('config.redis');

  return {
    redis: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      // Bull maneja sus propios reintentos internos; forzamos null para no romper con IORedis
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      timeout: 30000, // Evita que procesos pesados congelen los workers
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 30000,
    },
  };
};
