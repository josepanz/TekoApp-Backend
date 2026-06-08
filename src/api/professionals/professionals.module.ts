import { Module } from '@nestjs/common';
import { ProfessionalsDbModule } from '@modules/professionals-db/professionals-db.module';
import { ProfessionalsController } from './controllers/professionals.controller';
import { ProfessionalsService } from './services/professionals.service';

@Module({
  imports: [ProfessionalsDbModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
