import { Module } from '@nestjs/common';
import { CountriesController } from './controllers/countries.controller';
import { CountriesService } from './services/countries.service';
import { CountriesDbModule } from '@modules/countries-db/countries-db.module';

@Module({
  imports: [CountriesDbModule],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}
