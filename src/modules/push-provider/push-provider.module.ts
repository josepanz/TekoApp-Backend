import { Module } from '@nestjs/common';
import { WebPushProviderService } from './services/web-push-provider.service';
import { FcmProviderService } from './services/fcm-provider.service';

@Module({
  providers: [WebPushProviderService, FcmProviderService],
  exports: [WebPushProviderService, FcmProviderService],
})
export class PushProviderModule {}
