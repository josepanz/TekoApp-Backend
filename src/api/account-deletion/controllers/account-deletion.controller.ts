import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { AccountDeletionService } from '../services/account-deletion.service';
import {
  DeletionCancelResponseDTO,
  DeletionRequestResponseDTO,
} from '../dtos/response';

// Bajo `auth/me` (no `users/me`): mismo criterio que `PUT /auth/me` — es autoservicio sobre la
// propia cuenta (solo JwtAuthGuard, sin permiso), y ese es el dominio real donde ya viven las
// acciones de "mi cuenta" en este repo (ver openspec/decisions.md, I-01).
@ApiTags('Cuenta')
@Controller('auth/me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AccountDeletionController {
  constructor(private readonly service: AccountDeletionService) {}

  @Post('deletion-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar el borrado de la propia cuenta',
    description:
      'Valida bloqueantes (servicio activo, pago pendiente, contrato sin firmar). Si no hay ' +
      'ninguno, inicia la ventana de gracia configurada.',
  })
  @ApiResponse({ status: 200, type: DeletionRequestResponseDTO })
  async requestDeletion(
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<DeletionRequestResponseDTO> {
    return this.service.requestDeletion(req.user.id);
  }

  @Post('deletion-request/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar una solicitud de borrado de cuenta activa',
  })
  @ApiResponse({ status: 200, type: DeletionCancelResponseDTO })
  async cancelDeletion(
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<DeletionCancelResponseDTO> {
    return this.service.cancelDeletion(req.user.id);
  }
}
