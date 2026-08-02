import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationDocument } from '../schemas/notification.schema';
import { NotificationStatus } from '../enums/notification-status.enum';

@Injectable()
export class NotificationsDbService {
  constructor(
    @InjectModel(NotificationDocument.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async create(
    data: Partial<NotificationDocument>,
  ): Promise<NotificationDocument> {
    return new this.model(data).save();
  }

  async insertMany(
    data: Partial<NotificationDocument>[],
  ): Promise<NotificationDocument[]> {
    return this.model.insertMany(data) as unknown as Promise<
      NotificationDocument[]
    >;
  }

  // `userId` es el id (Int) de Postgres, no un ObjectId de Mongo — el campo `userId` del schema
  // SÍ está tipado como ObjectId (ver notification.schema.ts), pero Mongoose castea un `number`
  // plano automáticamente vía `new ObjectId(numero)` (encoding determinístico, no aleatorio) al
  // construir el filtro. Un STRING numérico (`"5"`) o un UUID NO castea (`ObjectId.isValid`
  // devuelve `false` para ambos) y tira `BSONError` — bug real que rompía todo este módulo antes
  // de este fix (el controller mandaba `String(req.user.id)`). Nunca envolver `userId` en
  // `String(...)` antes de llamar a este service.
  async findByUserId(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<NotificationDocument[]> {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async findUnreadByUserId(userId: number): Promise<NotificationDocument[]> {
    return this.model
      .find({ userId, status: { $ne: NotificationStatus.READ } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countUnreadByUserId(userId: number): Promise<number> {
    return this.model
      .countDocuments({ userId, status: { $ne: NotificationStatus.READ } })
      .exec();
  }

  async updateStatus(
    id: string,
    userId: number,
    updateData: Partial<NotificationDocument>,
  ): Promise<NotificationDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: id, userId }, updateData, { new: true })
      .exec();
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.model
      .updateMany(
        { userId, status: { $ne: NotificationStatus.READ } },
        { status: NotificationStatus.READ, readAt: new Date() },
      )
      .exec();
  }

  async deleteOne(id: string, userId: number): Promise<void> {
    await this.model.deleteOne({ _id: id, userId }).exec();
  }

  async updateStatusByIdDirectly(
    id: string,
    updateData: Partial<NotificationDocument>,
  ): Promise<void> {
    await this.model.findByIdAndUpdate(id, updateData).exec();
  }
}
