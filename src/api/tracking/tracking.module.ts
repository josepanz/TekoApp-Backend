// src/api/tracking/tracking.module.ts
import { Module } from '@nestjs/common';
import { TrackingController } from './controllers/tracking.controller';
import { TrackingApiService } from './services/tracking.service';
import { GeoTrackingDbModule } from '../../modules/geo-tracking-db/geo-tracking-db.module';

@Module({
  imports: [GeoTrackingDbModule],
  controllers: [TrackingController],
  providers: [TrackingApiService],
})
export class TrackingModule {}
