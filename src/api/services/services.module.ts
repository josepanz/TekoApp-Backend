import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';

import { ServicesController } from './controllers/services.controller';
import { ServicesService } from './services/services.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
