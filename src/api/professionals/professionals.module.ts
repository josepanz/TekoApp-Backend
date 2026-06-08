import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';

import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
