import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ServiceRequestParamsDTO } from '@api/services/dtos/request/service-request-params.param.dto';
import { BudgetsService } from '../services/budgets.service';
import {
  ReplaceBudgetOptionsRequestDTO,
  SelectBudgetOptionParamsDTO,
} from '../dtos/request';
import {
  BudgetOptionResponseDTO,
  BudgetOptionsListResponseDTO,
} from '../dtos/response';
import {
  ApiGetBudgetOptions,
  ApiReplaceBudgetOptions,
  ApiSelectBudgetOption,
} from '../docs/budgets.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('budgets')
@Controller('services/:id/requests/:requestId/budget-options')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Put()
  @ApiReplaceBudgetOptions()
  async replace(
    @Param() params: ServiceRequestParamsDTO,
    @Body() dto: ReplaceBudgetOptionsRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<BudgetOptionsListResponseDTO> {
    return this.service.replaceOptions(
      params.id,
      params.requestId,
      dto,
      req.user.id,
      req.user.referenceId,
    );
  }

  @Get()
  @ApiGetBudgetOptions()
  async list(
    @Param() params: ServiceRequestParamsDTO,
    @Request() req: RequestWithUser,
  ): Promise<BudgetOptionsListResponseDTO> {
    return this.service.listOptions(params.id, params.requestId, req.user.id);
  }

  @Patch(':optionReferenceId/select')
  @ApiSelectBudgetOption()
  async select(
    @Param() params: SelectBudgetOptionParamsDTO,
    @Request() req: RequestWithUser,
  ): Promise<BudgetOptionResponseDTO> {
    return this.service.selectOption(
      params.id,
      params.requestId,
      params.optionReferenceId,
      req.user.id,
    );
  }
}
