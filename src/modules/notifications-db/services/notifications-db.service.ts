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

  async findByUserId(
    userId: string,
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

  async findUnreadByUserId(userId: string): Promise<NotificationDocument[]> {
    return this.model
      .find({ userId, status: { $ne: NotificationStatus.READ } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.model
      .countDocuments({ userId, status: { $ne: NotificationStatus.READ } })
      .exec();
  }

  async updateStatus(
    id: string,
    userId: string,
    updateData: Partial<NotificationDocument>,
  ): Promise<NotificationDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: id, userId }, updateData, { new: true })
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.model
      .updateMany(
        { userId, status: { $ne: NotificationStatus.READ } },
        { status: NotificationStatus.READ, readAt: new Date() },
      )
      .exec();
  }

  async deleteOne(id: string, userId: string): Promise<void> {
    await this.model.deleteOne({ _id: id, userId }).exec();
  }

  async updateStatusByIdDirectly(
    id: string,
    updateData: Partial<NotificationDocument>,
  ): Promise<void> {
    await this.model.findByIdAndUpdate(id, updateData).exec();
  }
}
