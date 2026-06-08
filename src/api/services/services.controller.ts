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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ServicesService } from './services.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceRequestDto,
  RespondServiceRequestDto,
  ServiceIdParamDTO,
  ServiceRequestParamsDTO,
  GetServicesListQueryDTO,
  GetNearbyServicesQueryDTO,
  GetMyServicesQueryDTO,
  CancelServiceRequestDTO,
} from './dto';

@ApiTags('services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo servicio' })
  @ApiResponse({ status: 201, description: 'Servicio creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createService(
    @Body() createServiceDto: CreateServiceDto,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.servicesService.createService(createServiceDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de servicios con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de servicios obtenida' })
  async getServices(@Query() query: GetServicesListQueryDTO) {
    return this.servicesService.getServices(query);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obtener servicios cercanos por ubicación' })
  @ApiResponse({ status: 200, description: 'Servicios cercanos obtenidos' })
  async getNearbyServices(@Query() query: GetNearbyServicesQueryDTO) {
    return this.servicesService.getNearbyServices(
      query.latitude,
      query.longitude,
      query.radius,
      query.categoryId,
    );
  }

  @Get('my-services')
  @ApiOperation({ summary: 'Obtener servicios del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Servicios del usuario obtenidos' })
  async getMyServices(
    @Request() req: { user: IUserDataOnJwt },
    @Query() query: GetMyServicesQueryDTO,
  ) {
    return this.servicesService.getMyServices(
      req.user.id,
      query.status,
      query.role,
    );
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  async getDashboardStats(@Request() req: { user: IUserDataOnJwt }) {
    return this.servicesService.getDashboardStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un servicio por ID' })
  @ApiResponse({ status: 200, description: 'Servicio encontrado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async getServiceById(@Param() param: ServiceIdParamDTO) {
    return this.servicesService.getServiceById(param.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un servicio' })
  @ApiResponse({ status: 200, description: 'Servicio actualizado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para modificar este servicio',
  })
  async updateService(
    @Param() param: ServiceIdParamDTO,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.servicesService.updateService(
      param.id,
      updateServiceDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar un servicio' })
  @ApiResponse({ status: 200, description: 'Servicio cancelado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para cancelar este servicio',
  })
  async cancelService(
    @Param() param: ServiceIdParamDTO,
    @Body() dto: CancelServiceRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.servicesService.cancelService(
      param.id,
      dto.reason,
      req.user.id,
    );
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aceptar un servicio (solo profesionales)' })
  @ApiResponse({ status: 200, description: 'Servicio aceptado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado o no es profesional',
  })
  async acceptService(
    @Param() param: ServiceIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.servicesService.acceptService(param.id, req.user.id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Iniciar un servicio (solo profesionales)' })
  @ApiResponse({ status: 200, description: 'Servicio iniciado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado o no es profesional',
  })
  async startService(
    @Param() param: ServiceIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.servicesService.startService(param.id, req.user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar un servicio (solo profesionales)' })
  @ApiResponse({ status: 200, description: 'Servicio completado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado o no es profesional',
  })
  async completeService(
    @Param() param: ServiceIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.servicesService.completeService(param.id, req.user.id);
  }

  @Post(':id/requests')
  @ApiOperation({
    summary: 'Crear una solicitud para un servicio (solo profesionales)',
  })
  @ApiResponse({ status: 201, description: 'Solicitud creada' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado o no es profesional',
  })
  async createServiceRequest(
    @Param() param: ServiceIdParamDTO,
    @Body() requestDto: CreateServiceRequestDto,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.servicesService.createServiceRequest(
      param.id,
      requestDto,
      req.user.id,
    );
  }

  @Get(':id/requests')
  @ApiOperation({ summary: 'Obtener solicitudes de un servicio' })
  @ApiResponse({ status: 200, description: 'Solicitudes obtenidas' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async getServiceRequests(@Param() param: ServiceIdParamDTO) {
    return this.servicesService.getServiceRequests(param.id);
  }

  @Put(':id/requests/:requestId')
  @ApiOperation({ summary: 'Responder a una solicitud de servicio' })
  @ApiResponse({ status: 200, description: 'Solicitud respondida' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para responder esta solicitud',
  })
  async respondToServiceRequest(
    @Param() params: ServiceRequestParamsDTO,
    @Body() responseDto: RespondServiceRequestDto,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.servicesService.respondToServiceRequest(
      params.id,
      params.requestId,
      responseDto,
      req.user.id,
    );
  }
}
