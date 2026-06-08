import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseFloatPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ServiceStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { ProfessionalsService } from './professionals.service';

@ApiTags('professionals')
@Controller('professionals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo profesional' })
  @ApiResponse({
    status: 201,
    description: 'Profesional registrado exitosamente',
  })
  async registerProfessional(
    @Body() registerDto: unknown,
    @Request() req: { user: { id: number } },
  ) {
    return this.professionalsService.registerProfessional(
      registerDto as never,
      Number(req.user.id),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de profesionales con filtros' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'latitude', required: false, type: Number })
  @ApiQuery({ name: 'longitude', required: false, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de profesionales obtenida' })
  async getProfessionals(
    @Query('categoryId') categoryId?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
    @Query('minRating') minRating?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('isAvailable') isAvailable?: boolean,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.professionalsService.getProfessionals({
      categoryId: categoryId ? Number(categoryId) : undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      radius: radius ? Number(radius) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      isAvailable,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obtener profesionales cercanos por ubicación' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Profesionales cercanos obtenidos' })
  async getNearbyProfessionals(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius') radius = 10,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.professionalsService.getNearbyProfessionals(
      latitude,
      longitude,
      Number(radius),
      categoryId ? Number(categoryId) : undefined,
    );
  }

  @Get('search/skills')
  @ApiOperation({ summary: 'Buscar profesionales por habilidades' })
  @ApiQuery({
    name: 'skills',
    required: true,
    description: 'Habilidades separadas por comas',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Profesionales encontrados por habilidades',
  })
  async searchBySkills(
    @Query('skills') skills: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.professionalsService.searchBySkills(
      skills.split(',').map((s) => s.trim()),
      Number(page),
      Number(limit),
    );
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Obtener profesionales mejor calificados' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Profesionales mejor calificados obtenidos',
  })
  async getTopRatedProfessionals(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit = 10,
  ) {
    return this.professionalsService.getTopRatedProfessionals(
      categoryId ? Number(categoryId) : undefined,
      Number(limit),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un profesional por ID' })
  @ApiResponse({ status: 200, description: 'Profesional encontrado' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async getProfessionalById(@Param('id', ParseIntPipe) id: number) {
    return this.professionalsService.getProfessionalById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar perfil de profesional' })
  @ApiResponse({ status: 200, description: 'Profesional actualizado' })
  async updateProfessional(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: unknown,
    @Request() req: { user: { id: number } },
  ) {
    return this.professionalsService.updateProfessional(
      id,
      updateDto,
      Number(req.user.id),
    );
  }

  @Post(':id/availability')
  @ApiOperation({ summary: 'Actualizar disponibilidad del profesional' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada' })
  async updateAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { isAvailable: boolean },
    @Request() req: { user: { id: number } },
  ) {
    return this.professionalsService.updateAvailability(
      id,
      dto.isAvailable,
      Number(req.user.id),
    );
  }

  @Post(':id/location')
  @ApiOperation({ summary: 'Actualizar ubicación del profesional' })
  @ApiResponse({ status: 200, description: 'Ubicación actualizada' })
  async updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { latitude: number; longitude: number },
    @Request() req: { user: { id: number } },
  ) {
    return this.professionalsService.updateLocation(
      id,
      dto,
      Number(req.user.id),
    );
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Obtener servicios del profesional' })
  @ApiQuery({ name: 'status', enum: ServiceStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Servicios del profesional obtenidos',
  })
  async getProfessionalServices(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: ServiceStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.professionalsService.getProfessionalServices(
      id,
      status,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Obtener reseñas del profesional' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Reseñas del profesional obtenidas',
  })
  async getProfessionalReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.professionalsService.getProfessionalReviews(
      id,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del profesional' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  async getProfessionalStats(@Param('id', ParseIntPipe) id: number) {
    return this.professionalsService.getProfessionalStats(id);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verificar identidad del profesional (solo admin)' })
  @ApiResponse({ status: 200, description: 'Profesional verificado' })
  async verifyProfessional(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { isVerified: boolean; notes?: string },
    @Request() req: { user: { id: number } },
  ) {
    return this.professionalsService.verifyProfessional(
      id,
      dto,
      Number(req.user.id),
    );
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspender profesional (solo admin)' })
  @ApiResponse({ status: 200, description: 'Profesional suspendido' })
  async suspendProfessional(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { reason: string },
    @Request() req: { user: { id: number } },
  ) {
    return this.professionalsService.suspendProfessional(
      id,
      dto.reason,
      Number(req.user.id),
    );
  }
}
