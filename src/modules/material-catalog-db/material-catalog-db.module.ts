import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { MaterialCatalogDbService } from './services/material-catalog-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [MaterialCatalogDbService],
  exports: [MaterialCatalogDbService],
})
export class MaterialCatalogDbModule {}
