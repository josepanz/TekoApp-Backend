import { Module } from '@nestjs/common';
import { ServiceTypesController } from './controllers/service-types.controller';
import { ServiceTypesService } from './services/service-types.service';
import { ServiceTypesDbModule } from '@modules/service-types-db/service-types-db.module';

@Module({
  imports: [ServiceTypesDbModule],
  controllers: [ServiceTypesController],
  providers: [ServiceTypesService],
  exports: [ServiceTypesService],
})
export class ServiceTypesModule {}
