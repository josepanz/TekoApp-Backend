import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { UpdateNotificationPreferenceRequestDTO } from '../dtos/request';
import { NotificationPreferencesResponseDTO } from '../dtos/response';

@ApiTags('Preferencias de notificación')
@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationPreferencesController {
  constructor(private readonly service: NotificationPreferencesService) {}

  @Get('me')
  @ApiOperation({
    summary:
      'Obtener las preferencias de notificación del usuario autenticado (un ítem por tipo)',
  })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDTO })
  async getMyPreferences(
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<NotificationPreferencesResponseDTO> {
    return this.service.getPreferences(req.user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary:
      'Activar/desactivar un tipo de notificación puntual (auto-save por switch)',
  })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDTO })
  async updateMyPreference(
    @Body() dto: UpdateNotificationPreferenceRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<NotificationPreferencesResponseDTO> {
    return this.service.updatePreference(req.user.id, dto);
  }
}
