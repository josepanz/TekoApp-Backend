import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { LocationsDbService } from './services/locations-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [LocationsDbService],
  exports: [LocationsDbService],
})
export class LocationsDbModule {}
