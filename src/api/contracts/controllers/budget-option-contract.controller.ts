import {
  Controller,
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
import { ContractsService } from '../services/contracts.service';
import { BudgetOptionReferenceParamDTO } from '../dtos/request';
import { ContractResponseDTO } from '../dtos/response';
import { ApiGenerateContract } from '../docs/contracts.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('contracts')
@Controller('budget-options')
@UseGuards(JwtAuthGuard)
export class BudgetOptionContractController {
  constructor(private readonly service: ContractsService) {}

  @Post(':referenceId/generate-contract')
  @HttpCode(HttpStatus.CREATED)
  @ApiGenerateContract()
  async generate(
    @Param() params: BudgetOptionReferenceParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<ContractResponseDTO> {
    return this.service.generateContract(
      params.referenceId,
      req.user.id,
      req.user.referenceId,
    );
  }
}
