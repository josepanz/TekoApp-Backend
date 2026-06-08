import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocationsController } from './controllers/locations.controller';
import { LocationsService } from './services/locations.service';
import { LocationsGateway } from './gateway/locations.gateway';
import { LocationsDbModule } from '@/modules/locations-db/locations-db.module';

@Module({
  imports: [
    LocationsDbModule,
    ConfigModule,
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
