import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  SERVICE_REQUEST = 'service_request',
  SERVICE_ACCEPTED = 'service_accepted',
  SERVICE_REJECTED = 'service_rejected',
  SERVICE_COMPLETED = 'service_completed',
  PAYMENT_RECEIVED = 'payment_received',
  RATING_RECEIVED = 'rating_received',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data?: Record<string, any>;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: [String], default: [] })
  channels: string[]; // email, push, sms, in_app

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Índices para mejorar el rendimiento
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });
