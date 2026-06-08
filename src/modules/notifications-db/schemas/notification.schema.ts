import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Schema({ timestamps: true, collection: 'notifications' })
export class NotificationDocument extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String, enum: NotificationType })
  type!: NotificationType;

  @Prop({ required: true, type: String })
  title!: string;

  @Prop({ required: true, type: String })
  message!: string;

  @Prop({ type: Object })
  data?: Record<string, any>;

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
  metadata?: Record<string, any>;
}

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationDocument);

NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });
