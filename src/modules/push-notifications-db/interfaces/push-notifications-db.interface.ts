import { DeviceType } from '@prisma/client';

export interface ICreatePushSubscriptionData {
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdBy: string;
}

export interface ICreateFcmTokenData {
  userId: number;
  token: string;
  deviceType: DeviceType;
  createdBy: string;
}
