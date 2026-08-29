import { Module } from '@nestjs/common';
import { MaterialCatalogDbModule } from '@modules/material-catalog-db/material-catalog-db.module';
import {
  AdminMaterialCatalogController,
  MaterialCatalogController,
} from './controllers/material-catalog.controller';
import { MaterialCatalogService } from './services/material-catalog.service';

@Module({
  imports: [MaterialCatalogDbModule],
  controllers: [MaterialCatalogController, AdminMaterialCatalogController],
  providers: [MaterialCatalogService],
  exports: [MaterialCatalogService],
})
export class MaterialCatalogModule {}
