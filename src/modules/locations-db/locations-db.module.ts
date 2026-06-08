import { Module } from '@nestjs/common';
import { LocationsDbService } from './services/locations-db.service';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Module({
  imports: [PrismaDatasource],
  providers: [LocationsDbService],
  exports: [LocationsDbService],
})
export class LocationsDbModule {}
