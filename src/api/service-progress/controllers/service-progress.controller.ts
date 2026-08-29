import {
  Body,
  Controller,
  Delete,
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
import { ServiceProgressService } from '../services/service-progress.service';
import {
  CreateServiceProgressEntryRequestDTO,
  ServiceProgressEntryParamsDTO,
  ServiceProgressServiceIdParamDTO,
} from '../dtos/request';
import {
  ServiceProgressEntryResponseDTO,
  ServiceProgressListResponseDTO,
} from '../dtos/response';
import {
  ApiCreateServiceProgressEntry,
  ApiDeleteServiceProgressEntry,
  ApiGetServiceProgress,
} from '../docs/service-progress.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('service-progress')
@Controller('services/:id/progress')
@UseGuards(JwtAuthGuard)
export class ServiceProgressController {
  constructor(
    private readonly serviceProgressService: ServiceProgressService,
  ) {}

  @Post()
  @ApiCreateServiceProgressEntry()
  async createEntry(
    @Param() param: ServiceProgressServiceIdParamDTO,
    @Body() dto: CreateServiceProgressEntryRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<ServiceProgressEntryResponseDTO> {
    return this.serviceProgressService.createEntry(
      param.id,
      dto,
      req.user.id,
      req.user.referenceId,
    );
  }

  @Get()
  @ApiGetServiceProgress()
  async list(
    @Param() param: ServiceProgressServiceIdParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<ServiceProgressListResponseDTO> {
    return this.serviceProgressService.listByService(param.id, req.user);
  }

  @Delete(':entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteServiceProgressEntry()
  async deleteEntry(
    @Param() param: ServiceProgressEntryParamsDTO,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.serviceProgressService.deleteEntry(
      param.entryId,
      req.user.id,
      req.user.referenceId,
    );
  }
}
