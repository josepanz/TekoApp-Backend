import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { CategoriesDbService } from './services/categories-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [CategoriesDbService],
  exports: [CategoriesDbService],
})
export class CategoriesDbModule {}
