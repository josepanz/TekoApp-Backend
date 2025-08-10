import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { LocationsGateway } from './locations.gateway';
import { Professional } from '../professionals/entities/professional.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Professional]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [LocationsController],
  providers: [LocationsService, LocationsGateway],
  exports: [LocationsService, LocationsGateway],
})
export class LocationsModule {}
