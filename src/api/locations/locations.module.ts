import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { LocationsController } from './controllers/locations.controller';
import { LocationsService } from './services/locations.service';
import { LocationsGateway } from './gateway/locations.gateway';
import { LocationsDbModule } from '@/modules/locations-db/locations-db.module';

@Module({
  imports: [
    LocationsDbModule,
    // El resto de la app firma/verifica JWT con el par RS256 real (JWT_PRIVATE_KEY/JWT_PUBLIC_KEY,
    // ver jwt.strategy.ts). Esta registración usaba `secret: configService.get('JWT_SECRET')` —
    // esa env var no existe en config-schema.ts/.env, así que el secreto siempre era `undefined` y
    // CUALQUIER verificación de un token real (firmado RS256) fallaba siempre — el handshake del
    // socket de /locations estaba roto de punta a punta, no solo "en riesgo de mismatch".
    JwtModule.registerAsync({
      useFactory: (configService: ConfigType<AppConfigType>) => ({
        publicKey: configService.authentication.publicKey,
        verifyOptions: { algorithms: ['RS256'] },
      }),
      inject: [APP_CONFIG.KEY],
    }),
  ],
  controllers: [LocationsController],
  providers: [LocationsService, LocationsGateway],
  exports: [LocationsService, LocationsGateway],
})
export class LocationsModule {}
