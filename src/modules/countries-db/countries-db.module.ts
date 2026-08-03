import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { CountriesDbService } from './services/countries-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [CountriesDbService],
  exports: [CountriesDbService],
})
export class CountriesDbModule {}
