import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PaymentIdParamDTO } from '@api/payments/dtos/request';
import { PaymentDisputesService } from '../services/payment-disputes.service';
import {
  CreateDisputeRequestDTO,
  DisputeReferenceParamDTO,
} from '../dtos/request';
import { DisputeResponseDTO, DisputesListResponseDTO } from '../dtos/response';
import {
  ApiListPaymentDisputes,
  ApiOpenDispute,
  ApiWithdrawDispute,
} from '../docs/payment-disputes.docs';

// Rutas anidadas bajo `payments/:id/disputes` — mismo prefijo que `PaymentController`, en un
// controller propio (Nest permite varios controllers compartiendo prefijo mientras las rutas no
// colisionen; ver openspec/changes/platform-hardening-2026-09/I-03-dispute-records.md).
@ApiTags('Disputas de pago')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentDisputesController {
  constructor(private readonly service: PaymentDisputesService) {}

  @Post(':id/disputes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOpenDispute()
  async openDispute(
    @Param() param: PaymentIdParamDTO,
    @Body() dto: CreateDisputeRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<DisputeResponseDTO> {
    return this.service.openDispute(
      param.id,
      req.user.id,
      req.user.referenceId,
      dto,
    );
  }

  @Get(':id/disputes')
  @ApiListPaymentDisputes()
  async listForPayment(
    @Param() param: PaymentIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<DisputesListResponseDTO> {
    return this.service.listForPayment(param.id, req.user);
  }

  @Post(':id/disputes/:referenceId/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiWithdrawDispute()
  async withdraw(
    @Param() param: PaymentIdParamDTO,
    @Param() disputeParam: DisputeReferenceParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<DisputeResponseDTO> {
    return this.service.withdraw(
      param.id,
      disputeParam.referenceId,
      req.user.id,
    );
  }
}
