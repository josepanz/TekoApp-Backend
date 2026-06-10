import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ProfessionalsDbService } from './services/professionals-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ProfessionalsDbService],
  exports: [ProfessionalsDbService],
})
export class ProfessionalsDbModule {}
