// api/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { DatabaseModule } from '@core/database/database.module';

@Module({
  imports: [
    TerminusModule,
    DatabaseModule,
    MongooseModule, // Necesario para inyectar la conexión de Mongo en los chequeos
  ],
  controllers: [HealthController],
})
export class HealthModule {}
