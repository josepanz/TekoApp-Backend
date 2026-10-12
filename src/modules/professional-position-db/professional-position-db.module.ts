// src/modules/professional-position-db/professional-position-db.module.ts
//
// Guarda la ÚLTIMA posición conocida de cada profesional (Postgres, tabla `professionals`:
// `currentLatitude`/`currentLongitude`/`lastLocationUpdate`) y resuelve la búsqueda de
// profesionales cercanos (`findNearby`, Haversine) sobre esa misma fila. Es estado *actual*,
// no histórico: cada ping de posición pisa el valor anterior.
//
// Antes existía un módulo hermano `geo-tracking-db` con el histórico de posiciones (MongoDB);
// se eliminó junto con el tracking: acá solo vive el estado actual.
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { ProfessionalPositionDbService } from './services/professional-position-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [ProfessionalPositionDbService],
  exports: [ProfessionalPositionDbService],
})
export class ProfessionalPositionDbModule {}
