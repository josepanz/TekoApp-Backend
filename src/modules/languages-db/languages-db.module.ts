import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { LanguagesDbService } from './services/languages-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [LanguagesDbService],
  exports: [LanguagesDbService],
})
export class LanguagesDbModule {}
