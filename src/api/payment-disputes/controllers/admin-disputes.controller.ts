import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PaymentDisputesService } from '../services/payment-disputes.service';
import {
  AdminDisputesQueryDTO,
  DisputeReferenceParamDTO,
  ResolveDisputeRequestDTO,
} from '../dtos/request';
import { DisputeResponseDTO, DisputesQueueResponseDTO } from '../dtos/response';
import {
  ApiClaimDispute,
  ApiListDisputesQueue,
  ApiResolveDispute,
} from '../docs/payment-disputes.docs';

@ApiTags('Disputas de pago (staff)')
@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminDisputesController {
  constructor(private readonly service: PaymentDisputesService) {}

  // `PermissionsGuard` solo lee metadata del HANDLER (`context.getHandler()`), nunca de la
  // clase — `@Permissions` tiene que ir método por método, mismo criterio que
  // `AdminPaymentsController`/`PaymentController` (ver .claude/rules/typescript.md).
  @Get()
  @Permissions(PERMISSIONS.DISPUTES.ADJUDICATE, PERMISSIONS.ADMIN.ALL)
  @ApiListDisputesQueue()
  async listQueue(
    @Query() query: AdminDisputesQueryDTO,
  ): Promise<DisputesQueueResponseDTO> {
    return this.service.listQueue(query);
  }

  @Patch(':referenceId/claim')
  @Permissions(PERMISSIONS.DISPUTES.ADJUDICATE, PERMISSIONS.ADMIN.ALL)
  @ApiClaimDispute()
  async claim(
    @Param() param: DisputeReferenceParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<DisputeResponseDTO> {
    return this.service.claim(param.referenceId, req.user.id);
  }

  @Patch(':referenceId/resolve')
  @Permissions(PERMISSIONS.DISPUTES.ADJUDICATE, PERMISSIONS.ADMIN.ALL)
  @ApiResolveDispute()
  async resolve(
    @Param() param: DisputeReferenceParamDTO,
    @Body() dto: ResolveDisputeRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<DisputeResponseDTO> {
    return this.service.resolve(param.referenceId, req.user.id, dto);
  }
}
