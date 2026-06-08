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
  ParseUUIDPipe,
  ParseEnumPipe,
  ParseFloatPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { ServicesService } from './services.service';
import { ServiceStatus, ServiceType } from './entities/service.entity';
import { RequestStatus } from './entities/service-request.entity';
import {
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceRequestDto,
  RespondServiceRequestDto,
  RateServiceDto,
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
    @Request() req: any,
  ) {
    return this.servicesService.createService(createServiceDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de servicios con filtros' })
  @ApiQuery({ name: 'status', enum: ServiceStatus, required: false })
  @ApiQuery({ name: 'type', enum: ServiceType, required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'latitude', required: false, type: Number })
  @ApiQuery({ name: 'longitude', required: false, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de servicios obtenida' })
  async getServices(
    @Query('status') status?: ServiceStatus,
    @Query('type') type?: ServiceType,
    @Query('categoryId') categoryId?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.servicesService.getServices({
      status,
      type,
      categoryId,
      latitude,
      longitude,
      radius,
      page,
      limit,
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obtener servicios cercanos por ubicación' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiResponse({ status: 200, description: 'Servicios cercanos obtenidos' })
  async getNearbyServices(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius') radius: number = 10,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.servicesService.getNearbyServices(
      latitude,
      longitude,
      radius,
      categoryId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un servicio por ID' })
  @ApiResponse({ status: 200, description: 'Servicio encontrado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async getServiceById(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.getServiceById(id);
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req: any,
  ) {
    return this.servicesService.updateService(
      id,
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.servicesService.cancelService(id, reason, req.user.id);
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
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.servicesService.acceptService(id, req.user.id);
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
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.servicesService.startService(id, req.user.id);
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
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.servicesService.completeService(id, req.user.id);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Calificar un servicio completado' })
  @ApiResponse({ status: 200, description: 'Servicio calificado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para calificar este servicio',
  })
  async rateService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() ratingDto: RateServiceDto,
    @Request() req: any,
  ) {
    return this.servicesService.rateService(id, ratingDto, req.user.id);
  }

  // Endpoints para solicitudes de servicio
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
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Body() requestDto: CreateServiceRequestDto,
    @Request() req: any,
  ) {
    return this.servicesService.createServiceRequest(
      serviceId,
      requestDto,
      req.user.id,
    );
  }

  @Get(':id/requests')
  @ApiOperation({ summary: 'Obtener solicitudes de un servicio' })
  @ApiResponse({ status: 200, description: 'Solicitudes obtenidas' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async getServiceRequests(@Param('id', ParseUUIDPipe) serviceId: string) {
    return this.servicesService.getServiceRequests(serviceId);
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
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() responseDto: RespondServiceRequestDto,
    @Request() req: any,
  ) {
    return this.servicesService.respondToServiceRequest(
      serviceId,
      requestId,
      responseDto,
      req.user.id,
    );
  }

  @Get('my-services')
  @ApiOperation({ summary: 'Obtener servicios del usuario autenticado' })
  @ApiQuery({ name: 'status', enum: ServiceStatus, required: false })
  @ApiQuery({ name: 'role', enum: ['client', 'professional'], required: false })
  @ApiResponse({ status: 200, description: 'Servicios del usuario obtenidos' })
  async getMyServices(
    @Query('status') status?: ServiceStatus,
    @Query('role') role?: 'client' | 'professional',
    @Request() req: any,
  ) {
    return this.servicesService.getMyServices(req.user.id, status, role);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  async getDashboardStats(@Request() req: any) {
    return this.servicesService.getDashboardStats(req.user.id);
  }
}
