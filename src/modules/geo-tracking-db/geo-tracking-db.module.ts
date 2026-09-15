// src/modules/geo-tracking-db/geo-tracking-db.module.ts
//
// Guarda el HISTÓRICO de posiciones de un profesional durante un servicio en curso (MongoDB,
// colección `geo_tracking_logs`: un documento por ping, con índice geoespacial `2dsphere` sobre
// `location`). Nunca pisa un registro anterior — es la traza completa del recorrido, no la
// posición actual.
//
// División con `professional-position-db` (T-03, WORKPLAN platform-hardening-2026-09): ese otro
// módulo guarda la ÚLTIMA posición conocida (Postgres, una fila por profesional que se
// actualiza en cada ping) y resuelve la búsqueda de profesionales cercanos sobre ella. Antes de
// este rename (`locations-db`/`tracking-db`) la diferencia no era evidente por el nombre —
// alguien nuevo asumía que eran duplicados.
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GeoTrackingDbService } from './services/geo-tracking-db.service';
import {
  GeoTrackingLog,
  GeoTrackingLogSchema,
} from './schemas/geo-tracking-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeoTrackingLog.name, schema: GeoTrackingLogSchema },
    ]),
  ],
  providers: [GeoTrackingDbService],
  exports: [GeoTrackingDbService], // Lo exportamos de manera agnóstica para consumo de la capa API
})
export class GeoTrackingDbModule {}
