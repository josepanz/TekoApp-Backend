import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ServicesService } from '../services/services.service';
import {
  CreateServiceRequestDTO,
  UpdateServiceRequestDTO,
  CreateServiceRequestRequestDTO,
  RespondServiceRequestRequestDTO,
  CancelServiceRequestDTO,
  ServiceIdParamDTO,
  ServiceRequestParamsDTO,
  GetServicesListQueryDTO,
  GetNearbyServicesQueryDTO,
  GetMyServicesQueryDTO,
} from '../dtos/request';
import {
  ServiceDetailResponseDTO,
  ServicesListResponseDTO,
  ServiceRequestDetailResponseDTO,
  ServiceRequestsListResponseDTO,
  ServiceStatsResponseDTO,
} from '../dtos/response';
import {
  CreateServiceDocs,
  GetServicesDocs,
  GetNearbyServicesDocs,
  GetMyServicesDocs,
  GetDashboardStatsDocs,
  GetServiceByIdDocs,
  UpdateServiceDocs,
  CancelServiceDocs,
  AcceptServiceDocs,
  StartServiceDocs,
  CompleteServiceDocs,
  CreateServiceRequestDocs,
  GetServiceRequestsDocs,
  RespondToServiceRequestDocs,
} from '../docs/services.docs';

@ApiTags('services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @CreateServiceDocs()
  async createService(
    @Body() dto: CreateServiceRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceDetailResponseDTO> {
    return this.servicesService.createService(dto, req.user.id);
  }

  @Get()
  @GetServicesDocs()
  async getServices(
    @Query() query: GetServicesListQueryDTO,
  ): Promise<ServicesListResponseDTO> {
    return this.servicesService.getServices(query);
  }

  @Get('nearby')
  @GetNearbyServicesDocs()
  async getNearbyServices(
    @Query() query: GetNearbyServicesQueryDTO,
  ): Promise<ServiceDetailResponseDTO[]> {
    return this.servicesService.getNearbyServices(
      query.latitude,
      query.longitude,
      query.radius,
      query.categoryId,
    );
  }

  @Get('my-services')
  @GetMyServicesDocs()
  async getMyServices(
    @Request() req: { user: IUserDataOnJwt },
    @Query() query: GetMyServicesQueryDTO,
  ): Promise<ServiceDetailResponseDTO[]> {
    return this.servicesService.getMyServices(
      req.user.id,
      query.status,
      query.role,
    );
  }

  @Get('dashboard/stats')
  @GetDashboardStatsDocs()
  async getDashboardStats(
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceStatsResponseDTO> {
    return this.servicesService.getDashboardStats(req.user.id);
  }

  @Get(':id')
  @GetServiceByIdDocs()
  async getServiceById(
    @Param() param: ServiceIdParamDTO,
  ): Promise<ServiceDetailResponseDTO> {
    return this.servicesService.getServiceById(param.id);
  }

  @Put(':id')
  @UpdateServiceDocs()
  async updateService(
    @Param() param: ServiceIdParamDTO,
    @Body() dto: UpdateServiceRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceDetailResponseDTO> {
    return this.servicesService.updateService(param.id, dto, req.user.id);
  }

  @Delete(':id')
  @CancelServiceDocs()
  async cancelService(
    @Param() param: ServiceIdParamDTO,
    @Body() dto: CancelServiceRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceDetailResponseDTO> {
    return this.servicesService.cancelService(
      param.id,
      dto.reason,
      req.user.id,
    );
  }

  @Post(':id/accept')
  @AcceptServiceDocs()
  async acceptService(
    @Param() param: ServiceIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceDetailResponseDTO> {
    return this.servicesService.acceptService(param.id, req.user.id);
  }

  @Post(':id/start')
  @StartServiceDocs()
  async startService(
    @Param() param: ServiceIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceDetailResponseDTO> {
    return this.servicesService.startService(param.id, req.user.id);
  }

  @Post(':id/complete')
  @CompleteServiceDocs()
  async completeService(
    @Param() param: ServiceIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceDetailResponseDTO> {
    return this.servicesService.completeService(param.id, req.user.id);
  }

  @Post(':id/requests')
  @CreateServiceRequestDocs()
  async createServiceRequest(
    @Param() param: ServiceIdParamDTO,
    @Body() dto: CreateServiceRequestRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceRequestDetailResponseDTO> {
    return this.servicesService.createServiceRequest(
      param.id,
      dto,
      req.user.id,
    );
  }

  @Get(':id/requests')
  @GetServiceRequestsDocs()
  async getServiceRequests(
    @Param() param: ServiceIdParamDTO,
  ): Promise<ServiceRequestsListResponseDTO> {
    return this.servicesService.getServiceRequests(param.id);
  }

  @Put(':id/requests/:requestId')
  @RespondToServiceRequestDocs()
  async respondToServiceRequest(
    @Param() params: ServiceRequestParamsDTO,
    @Body() dto: RespondServiceRequestRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ServiceRequestDetailResponseDTO> {
    return this.servicesService.respondToServiceRequest(
      params.id,
      params.requestId,
      dto,
      req.user.id,
    );
  }
}
