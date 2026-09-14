// src/infra/database/mongo/schemas/geo-tracking-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MongoCollections } from '../constants/constants';

@Schema({
  // Convención: plural y snake_case mediante la constante
  collection: MongoCollections.GeoTrackingLogs,
  // Automatiza la creación de campos createdAt y updatedAt de Mongo
  timestamps: true,
  // Elimina el horrible campo "__v" que Mongoose mete por defecto para control de versiones
  versionKey: false,
})
export class GeoTrackingLog extends Document {
  @Prop({ type: Number, required: true, index: true })
  professionalId: number; // Mapea directo al ID entero (Int) de tu Postgres

  @Prop({ type: String, required: true, index: true })
  serviceId: string; // Mapea al UUID (String) del servicio activo en Postgres

  // Estructura GeoJSON nativa para queries espaciales
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ type: Number, required: false })
  heading?: number; // Dirección en grados (0-360) para animar el autito en el mapa

  @Prop({ type: Number, required: false })
  speed?: number; // Velocidad del profesional (útil para métricas futuras)
}

export const GeoTrackingLogSchema =
  SchemaFactory.createForClass(GeoTrackingLog);

// 🔥 MEJOR PRÁCTICA CRÍTICA: Crear el índice geoespacial 2dsphere
// Esto le dice a Mongo: "Optimiza este objeto para cálculo de mapas y distancias"
GeoTrackingLogSchema.index({ location: '2dsphere' });

// Índice compuesto para buscar rápido el historial de un profesional en un servicio específico
GeoTrackingLogSchema.index({ professionalId: 1, serviceId: 1, createdAt: -1 });
