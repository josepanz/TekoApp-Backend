import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Professional } from '../professionals/entities/professional.entity';
import { ServiceRequest } from '../services/entities/service-request.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Professional,
      ServiceRequest,
      Payment,
      Rating,
      Category,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
