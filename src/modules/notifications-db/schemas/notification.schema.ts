import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Schema({ timestamps: true, collection: 'notifications' })
export class NotificationDocument extends Document {
  // El id (Int) de Postgres del destinatario — NUNCA un ObjectId de Mongo. No hay colección de
  // usuarios en Mongo (Users vive en Postgres vía Prisma), así que el `ref: 'User'` que tenía este
  // campo antes era vestigial y nunca resolvía nada. Usar `Number` en vez de `ObjectId` porque
  // `new Types.ObjectId(numero)` NO es determinístico más allá de sus primeros 4 bytes (el resto
  // es aleatorio/incremental por instancia) — dos llamadas con el mismo `numero` producen
  // ObjectIds DISTINTOS, así que guardar el id así rompe cualquier búsqueda posterior por
  // `userId` (confirmado empíricamente: `new Types.ObjectId(42)` da un valor distinto cada vez que
  // se invoca). `Number` evita el problema de raíz: es el tipo que este campo siempre representó.
  @Prop({ required: true, type: Number, index: true })
  userId!: number;

  @Prop({ required: true, type: String, enum: NotificationType })
  type!: NotificationType;

  @Prop({ required: true, type: String })
  title!: string;

  @Prop({ required: true, type: String })
  message!: string;

  @Prop({ type: Object })
  data?: Record<string, unknown>;

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Prop({ type: Date })
  readAt?: Date | null;

  @Prop({ type: Date })
  sentAt?: Date | null;

  @Prop({ type: [String], default: ['in_app'] })
  channels!: string[];

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationDocument);

NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });
