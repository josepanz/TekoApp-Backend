// src/modules/tracking-db/tracking-db.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeoTrackingLog } from '../schemas/geo-tracking-log.schema';

// Definimos un tipo intersección para el objeto plano de salida con sus campos automáticos de Mongo
export type GeoTrackingLogLean = Omit<
  GeoTrackingLog,
  keyof import('mongoose').Document
> & {
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TrackingDbService {
  private readonly logger = new Logger(TrackingDbService.name);

  constructor(
    @InjectModel(GeoTrackingLog.name)
    private readonly geoTrackingModel: Model<GeoTrackingLog>,
  ) {}

  async saveLocationPing(data: {
    professionalId: number;
    serviceId: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }): Promise<void> {
    try {
      await this.geoTrackingModel.create({
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        heading: data.heading,
        speed: data.speed,
        location: {
          type: 'Point',
          coordinates: [data.longitude, data.latitude],
        },
      });
    } catch (error) {
      this.logger.error('Error al guardar telemetría en MongoDB', error);
      throw error;
    }
  }

  /**
   * Busca registros geoespaciales retornando objetos planos fuertemente tipados
   */
  async findInRadius(
    latitude: number,
    longitude: number,
    radiusInMeters: number,
  ): Promise<GeoTrackingLogLean[]> {
    // <-- Forzamos el tipo de retorno aquí
    try {
      return await this.geoTrackingModel
        .find({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude],
              },
              $maxDistance: radiusInMeters,
            },
          },
        })
        .select('professionalId location createdAt heading speed')
        .limit(50)
        .lean<GeoTrackingLogLean[]>() // <-- Pasamos el tipo genérico a .lean() para resolver el error ts(2339)
        .exec();
    } catch (error) {
      this.logger.error(
        'Error al ejecutar query geoespacial en MongoDB',
        error,
      );
      throw error;
    }
  }
}
