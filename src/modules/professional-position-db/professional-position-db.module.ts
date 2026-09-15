// src/modules/professional-position-db/professional-position-db.module.ts
//
// Guarda la ÚLTIMA posición conocida de cada profesional (Postgres, tabla `professionals`:
// `currentLatitude`/`currentLongitude`/`lastLocationUpdate`) y resuelve la búsqueda de
// profesionales cercanos (`findNearby`, Haversine) sobre esa misma fila. Es estado *actual*,
// no histórico: cada ping de posición pisa el valor anterior.
//
// División con `geo-tracking-db` (T-03, WORKPLAN platform-hardening-2026-09): ese otro módulo
// persiste el HISTÓRICO de posiciones (MongoDB, un documento por ping, nunca se pisa) para
// trazabilidad de un servicio en curso. Antes de este rename (`locations-db`/`tracking-db`) la
// diferencia no era evidente por el nombre — alguien nuevo asumía que eran duplicados.
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ProfessionalPositionDbService } from './services/professional-position-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ProfessionalPositionDbService],
  exports: [ProfessionalPositionDbService],
})
export class ProfessionalPositionDbModule {}
