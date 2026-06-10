// src/modules/tracking-db/tracking-db.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingDbService } from './services/tacking-db.service';
import {
  GeoTrackingLog,
  GeoTrackingLogSchema,
} from './schemas/geo-tracking-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeoTrackingLog.name, schema: GeoTrackingLogSchema },
    ]),
  ],
  providers: [TrackingDbService],
  exports: [TrackingDbService], // Lo exportamos de manera agnóstica para consumo de la capa API
})
export class TrackingDbModule {}
