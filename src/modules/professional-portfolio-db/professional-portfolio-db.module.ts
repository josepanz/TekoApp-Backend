import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ProfessionalPortfolioDbService } from './services/professional-portfolio-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ProfessionalPortfolioDbService],
  exports: [ProfessionalPortfolioDbService],
})
export class ProfessionalPortfolioDbModule {}
