import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Put,
  Sse,
  HttpCode,
  HttpStatus,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationRequestDTO } from '../dtos/request/create-notification-request.dto';
import { FindAllNotificationsQueryDTO } from '../dtos/request/find-all-notifications-query.dto';
import { NotificationIdParamDTO } from '../dtos/request/notification-id-param.dto';
import { CreatePushSubscriptionRequestDTO } from '../dtos/request/create-push-subscription.request.dto';
import { PushSubscriptionReferenceIdParamDTO } from '../dtos/request/push-subscription-reference-id-param.dto';
import { CreateFcmTokenRequestDTO } from '../dtos/request/create-fcm-token.request.dto';
import { FcmTokenReferenceIdParamDTO } from '../dtos/request/fcm-token-reference-id-param.dto';
import { UnreadCountResponseDTO } from '../dtos/response/unread-count-response.dto';
import { NotificationResponseDTO } from '../dtos/response/notification-response.dto';
import { VapidPublicKeyResponseDTO } from '../dtos/response/vapid-public-key-response.dto';
import { PushSubscriptionResponseDTO } from '../dtos/response/push-subscription-response.dto';
import { FcmTokenResponseDTO } from '../dtos/response/fcm-token-response.dto';

@ApiTags('Notificaciones')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir y encolar una nueva notificación' })
  @ApiResponse({ status: 201, type: NotificationResponseDTO })
  async create(
    @Body() dto: CreateNotificationRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.notificationsService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener historial de notificaciones paginado del usuario',
  })
  @ApiResponse({ status: 200, type: [NotificationResponseDTO] })
  async findAll(
    @Request() req: { user: IUserDataOnJwt },
    @Query() query: FindAllNotificationsQueryDTO,
  ) {
    return this.notificationsService.findAll(
      req.user.id,
      query.limit,
      query.offset,
    );
  }

  @Get('unread')
  @ApiOperation({ summary: 'Listar las notificaciones no leídas' })
  @ApiResponse({ status: 200, type: [NotificationResponseDTO] })
  async findUnread(@Request() req: { user: IUserDataOnJwt }) {
    return this.notificationsService.findUnread(req.user.id);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Obtener contador de elementos no leídos' })
  @ApiResponse({ status: 200, type: UnreadCountResponseDTO })
  async getUnreadCount(
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<UnreadCountResponseDTO> {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación específica como leída' })
  @ApiResponse({ status: 200, type: NotificationResponseDTO })
  async markAsRead(
    @Param() param: NotificationIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.notificationsService.markAsRead(param.id, req.user.id);
  }

  @Put('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marcar todas las notificaciones del usuario como leídas',
  })
  @ApiResponse({ status: 204 })
  async markAllAsRead(@Request() req: { user: IUserDataOnJwt }) {
    await this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover una notificación del historial' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param() param: NotificationIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    await this.notificationsService.delete(param.id, req.user.id);
  }

  // ─── Tiempo real (SSE) ────────────────────────────────────────────────────

  @Sse('stream')
  @ApiOperation({
    summary:
      'Stream en tiempo real de notificaciones (SSE) para el usuario autenticado — solo cubre "app abierta ahora mismo", complementario a Web Push/FCM',
  })
  stream(@Request() req: { user: IUserDataOnJwt }): Observable<MessageEvent> {
    return this.notificationsService.streamForUser(req.user.id);
  }

  // ─── Web Push (VAPID) ─────────────────────────────────────────────────────

  @Get('push/vapid-public-key')
  @ApiOperation({
    summary: 'Obtener la clave pública VAPID para pushManager.subscribe()',
  })
  @ApiResponse({ status: 200, type: VapidPublicKeyResponseDTO })
  getVapidPublicKey(): VapidPublicKeyResponseDTO {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  @Post('push-subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Registrar (o actualizar) la suscripción Web Push del navegador actual',
  })
  @ApiResponse({ status: 201, type: PushSubscriptionResponseDTO })
  async registerPushSubscription(
    @Body() dto: CreatePushSubscriptionRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.notificationsService.registerPushSubscription(
      dto,
      req.user.id,
      req.user.email,
    );
  }

  @Delete('push-subscriptions/:referenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Dar de baja una suscripción Web Push' })
  @ApiResponse({ status: 204 })
  async removePushSubscription(
    @Param() param: PushSubscriptionReferenceIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    await this.notificationsService.removePushSubscription(
      param.referenceId,
      req.user.id,
    );
  }

  // ─── FCM (mobile) ─────────────────────────────────────────────────────────

  @Post('fcm-tokens')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar (o actualizar) el token FCM del dispositivo actual',
  })
  @ApiResponse({ status: 201, type: FcmTokenResponseDTO })
  async registerFcmToken(
    @Body() dto: CreateFcmTokenRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.notificationsService.registerFcmToken(
      dto,
      req.user.id,
      req.user.email,
    );
  }

  @Delete('fcm-tokens/:referenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Dar de baja un token FCM' })
  @ApiResponse({ status: 204 })
  async removeFcmToken(
    @Param() param: FcmTokenReferenceIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    await this.notificationsService.removeFcmToken(
      param.referenceId,
      req.user.id,
    );
  }
}
