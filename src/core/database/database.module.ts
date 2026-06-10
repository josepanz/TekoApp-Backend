// src/infra/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { getMongooseConfig } from '@/core/database/base/mongo/database.config';
import { getBullConfig } from '@/core/config/redis.config';

@Global()
@Module({
  imports: [
    // 🍃 MongoDB - Inicialización dinámica vía ConfigService
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getMongooseConfig(configService),
    }),

    // 🐂 Bull (Redis) - Inicialización dinámica para Colas Asíncronas
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getBullConfig(configService),
    }),
  ],
  providers: [PrismaDatasource],
  exports: [PrismaDatasource, MongooseModule, BullModule],
})
export class DatabaseModule {}
