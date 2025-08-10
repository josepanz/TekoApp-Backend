import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { BullModuleOptions } from '@nestjs/bull';

export class DatabaseConfig {
  // Configuración de PostgreSQL con TypeORM
  static getTypeOrmConfig(configService: ConfigService): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: configService.get('POSTGRES_HOST', 'localhost'),
      port: configService.get('POSTGRES_PORT', 5432),
      username: configService.get('POSTGRES_USER', 'postgres'),
      password: configService.get('POSTGRES_PASSWORD', 'password'),
      database: configService.get('POSTGRES_DB', 'tekoapp'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../../database/migrations/*{.ts,.js}'],
      synchronize: configService.get('NODE_ENV') === 'development',
      logging: configService.get('NODE_ENV') === 'development',
      ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      keepConnectionAlive: true,
      retryAttempts: 3,
      retryDelay: 3000,
      poolSize: 10,
      extra: {
        max: 20,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        query_timeout: 30000,
        statement_timeout: 30000,
      },
    };
  }

  // Configuración de MongoDB con Mongoose
  static getMongooseConfig(configService: ConfigService): MongooseModuleOptions {
    return {
      uri: configService.get('MONGODB_URI', 'mongodb://localhost:27017/tekoapp'),
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
      autoIndex: configService.get('NODE_ENV') === 'development',
      autoCreate: configService.get('NODE_ENV') === 'development',
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('MongoDB conectado exitosamente');
        });
        
        connection.on('error', (error) => {
          console.error('Error de conexión MongoDB:', error);
        });
        
        connection.on('disconnected', () => {
          console.log('MongoDB desconectado');
        });
        
        return connection;
      },
    };
  }

  // Configuración de Redis con Bull
  static getBullConfig(configService: ConfigService): BullModuleOptions {
    return {
      redis: {
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        maxLoadingTimeout: 10000,
        enableReadyCheck: true,
        maxMemoryPolicy: 'allkeys-lru',
        maxMemory: '2gb',
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        delay: 0,
        priority: 0,
        lifo: false,
        timeout: 30000,
        jobId: undefined,
        stackTraceLimit: 0,
      },
      limiter: {
        max: 1000,
        duration: 5000,
        delay: 1000,
        groupKey: 'job',
      },
      settings: {
        stalledInterval: 30000,
        maxStalledCount: 1,
        guardInterval: 5000,
        retryProcessDelay: 5000,
        backoffDelay: 5000,
        lockDuration: 30000,
        lockRenewTime: 15000,
        maxLockDuration: 60000,
        lockKey: 'bull:lock',
        lockTTL: 30000,
        lockRenewTime: 15000,
        maxLockDuration: 60000,
        lockKey: 'bull:lock',
        lockTTL: 30000,
      },
    };
  }

  // Configuración de conexión de prueba
  static getTestConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'tekoapp_test',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
      dropSchema: true,
    };
  }

  // Configuración de migración
  static getMigrationConfig(configService: ConfigService): TypeOrmModuleOptions {
    return {
      ...this.getTypeOrmConfig(configService),
      migrationsRun: false,
      synchronize: false,
    };
  }

  // Configuración de seeds
  static getSeedConfig(configService: ConfigService): TypeOrmModuleOptions {
    return {
      ...this.getTypeOrmConfig(configService),
      synchronize: false,
      logging: false,
    };
  }
}
