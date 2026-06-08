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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
import { UnreadCountResponseDTO } from '../dtos/response/unread-count-response.dto';
import { NotificationResponseDTO } from '../dtos/response/notification-response.dto';

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
    return this.notificationsService.create(dto, String(req.user.id));
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
      String(req.user.id),
      query.limit,
      query.offset,
    );
  }

  @Get('unread')
  @ApiOperation({ summary: 'Listar las notificaciones no leídas' })
  @ApiResponse({ status: 200, type: [NotificationResponseDTO] })
  async findUnread(@Request() req: { user: IUserDataOnJwt }) {
    return this.notificationsService.findUnread(String(req.user.id));
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Obtener contador de elementos no leídos' })
  @ApiResponse({ status: 200, type: UnreadCountResponseDTO })
  async getUnreadCount(
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<UnreadCountResponseDTO> {
    const count = await this.notificationsService.getUnreadCount(
      String(req.user.id),
    );
    return { count };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación específica como leída' })
  @ApiResponse({ status: 200, type: NotificationResponseDTO })
  async markAsRead(
    @Param() param: NotificationIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.notificationsService.markAsRead(param.id, String(req.user.id));
  }

  @Put('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marcar todas las notificaciones del usuario como leídas',
  })
  @ApiResponse({ status: 204 })
  async markAllAsRead(@Request() req: { user: IUserDataOnJwt }) {
    await this.notificationsService.markAllAsRead(String(req.user.id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover una notificación del historial' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param() param: NotificationIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    await this.notificationsService.delete(param.id, String(req.user.id));
  }
}
