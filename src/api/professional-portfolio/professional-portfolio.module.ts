import { Module } from '@nestjs/common';
import { ProfessionalPortfolioDbModule } from '@modules/professional-portfolio-db/professional-portfolio-db.module';
import { ProfessionalsDbModule } from '@modules/professionals-db/professionals-db.module';
import { StorageModule } from '@modules/storage/storage.module';
import { LegalConsentsModule } from '@api/legal-consents/legal-consents.module';
import { LegalConsentsDbModule } from '@modules/legal-consents-db/legal-consents-db.module';
import { AdminProfessionalPortfolioController } from './controllers/admin-professional-portfolio.controller';
import { ProfessionalPortfolioController } from './controllers/professional-portfolio.controller';
import { ProfessionalPortfolioService } from './services/professional-portfolio.service';

@Module({
  imports: [
    ProfessionalPortfolioDbModule,
    ProfessionalsDbModule,
    StorageModule,
    LegalConsentsModule,
    LegalConsentsDbModule,
  ],
  controllers: [
    ProfessionalPortfolioController,
    AdminProfessionalPortfolioController,
  ],
  providers: [ProfessionalPortfolioService],
})
export class ProfessionalPortfolioModule {}
