import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ContractsService } from '../services/contracts.service';
import {
  ContractReferenceParamDTO,
  SignContractRequestDTO,
} from '../dtos/request';
import {
  ContractPdfResponseDTO,
  ContractResponseDTO,
  MyContractsListResponseDTO,
} from '../dtos/response';
import {
  ApiGetContract,
  ApiGetContractPdf,
  ApiGetMyContracts,
  ApiSignContract,
} from '../docs/contracts.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('contracts')
@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get()
  @ApiGetMyContracts()
  async getMine(
    @Request() req: RequestWithUser,
  ): Promise<MyContractsListResponseDTO> {
    return this.service.listMine(req.user.id);
  }

  @Get(':referenceId')
  @ApiGetContract()
  async getOne(
    @Param() params: ContractReferenceParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<ContractResponseDTO> {
    return this.service.getContract(params.referenceId, req.user.id);
  }

  @Post(':referenceId/sign')
  @ApiSignContract()
  async sign(
    @Param() params: ContractReferenceParamDTO,
    @Body() dto: SignContractRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<ContractResponseDTO> {
    return this.service.signContract(params.referenceId, req.user.id, dto);
  }

  @Get(':referenceId/pdf')
  @ApiGetContractPdf()
  async getPdf(
    @Param() params: ContractReferenceParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<ContractPdfResponseDTO> {
    return this.service.getPdfUrl(params.referenceId, req.user);
  }
}
