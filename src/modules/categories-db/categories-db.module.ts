import { Module } from '@nestjs/common';
import { CategoriesDbService } from './services/categories-db.service';
import { PrismaDatasource } from '@/core/database/services/prisma.service'; // Ajustar alias según tu core

@Module({
  imports: [PrismaDatasource],
  providers: [CategoriesDbService],
  exports: [CategoriesDbService],
})
export class CategoriesDbModule {}
