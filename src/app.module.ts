import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

// Módulos de la aplicación
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { ServicesModule } from './modules/services/services.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Configuración de la base de datos
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Configuración de PostgreSQL (TypeORM)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => DatabaseConfig.getTypeOrmConfig(configService),
      inject: [ConfigService],
    }),

    // Configuración de MongoDB (Mongoose)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),

    // Configuración de Redis para colas de trabajo
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => RedisConfig.getBullConfig(configService),
      inject: [ConfigService],
    }),

    // Módulo de programación de tareas
    ScheduleModule.forRoot(),

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    ProfessionalsModule,
    ServicesModule,
    LocationsModule,
    PaymentsModule,
    NotificationsModule,
    PromotionsModule,
    RatingsModule,
    CategoriesModule,
    UploadsModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
