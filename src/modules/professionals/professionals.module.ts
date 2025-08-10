import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { Professional } from './entities/professional.entity';
import { ProfessionalCategory } from './entities/professional-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Professional, ProfessionalCategory])],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
