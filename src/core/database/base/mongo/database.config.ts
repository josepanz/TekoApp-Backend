import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

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
