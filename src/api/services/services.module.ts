import { Module } from '@nestjs/common';
import { ServicesDbModule } from '@modules/services-db/services-db.module';

import { ServicesController } from './controllers/services.controller';
import { ServicesService } from './services/services.service';

@Module({
  imports: [ServicesDbModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
