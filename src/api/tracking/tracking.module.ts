// src/api/tracking/tracking.module.ts
import { Module } from '@nestjs/common';
import { TrackingController } from './controllers/tracking.controller';
import { TrackingApiService } from './services/tracking.service';
import { TrackingDbModule } from '../../modules/tracking-db/tracking-db.module';

@Module({
  imports: [TrackingDbModule],
  controllers: [TrackingController],
  providers: [TrackingApiService],
})
export class TrackingModule {}
