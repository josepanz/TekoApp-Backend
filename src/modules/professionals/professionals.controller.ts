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
  ParseFloatPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfessionalsService } from './professionals.service';

@ApiTags('professionals')
@Controller('professionals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo profesional' })
  @ApiResponse({ status: 201, description: 'Profesional registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async registerProfessional(@Body() registerDto: any, @Request() req: any) {
    return this.professionalsService.registerProfessional(registerDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de profesionales con filtros' })
  @ApiQuery({ name: 'categoryId', required: false })
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
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.professionalsService.getProfessionals({
      categoryId,
      latitude,
      longitude,
      radius,
      minRating,
      maxPrice,
      isAvailable,
      page,
      limit,
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obtener profesionales cercanos por ubicación' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiResponse({ status: 200, description: 'Profesionales cercanos obtenidos' })
  async getNearbyProfessionals(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius') radius: number = 10,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.professionalsService.getNearbyProfessionals(latitude, longitude, radius, categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un profesional por ID' })
  @ApiResponse({ status: 200, description: 'Profesional encontrado' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async getProfessionalById(@Param('id', ParseUUIDPipe) id: string) {
    return this.professionalsService.getProfessionalById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar perfil de profesional' })
  @ApiResponse({ status: 200, description: 'Profesional actualizado' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado para modificar este profesional' })
  async updateProfessional(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    return this.professionalsService.updateProfessional(id, updateDto, req.user.id);
  }

  @Post(':id/availability')
  @ApiOperation({ summary: 'Actualizar disponibilidad del profesional' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async updateAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() availabilityDto: any,
    @Request() req: any,
  ) {
    return this.professionalsService.updateAvailability(id, availabilityDto, req.user.id);
  }

  @Post(':id/location')
  @ApiOperation({ summary: 'Actualizar ubicación del profesional' })
  @ApiResponse({ status: 200, description: 'Ubicación actualizada' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() locationDto: any,
    @Request() req: any,
  ) {
    return this.professionalsService.updateLocation(id, locationDto, req.user.id);
  }

  @Post(':id/categories')
  @ApiOperation({ summary: 'Agregar categorías al profesional' })
  @ApiResponse({ status: 200, description: 'Categorías agregadas' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async addCategories(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() categoriesDto: any,
    @Request() req: any,
  ) {
    return this.professionalsService.addCategories(id, categoriesDto.categoryIds, req.user.id);
  }

  @Delete(':id/categories/:categoryId')
  @ApiOperation({ summary: 'Remover categoría del profesional' })
  @ApiResponse({ status: 200, description: 'Categoría removida' })
  @ApiResponse({ status: 404, description: 'Profesional o categoría no encontrada' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async removeCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Request() req: any,
  ) {
    return this.professionalsService.removeCategory(id, categoryId, req.user.id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Obtener servicios del profesional' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Servicios del profesional obtenidos' })
  async getProfessionalServices(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.professionalsService.getProfessionalServices(id, status, page, limit);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Obtener reseñas del profesional' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Reseñas del profesional obtenidas' })
  async getProfessionalReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.professionalsService.getProfessionalReviews(id, page, limit);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del profesional' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async getProfessionalStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.professionalsService.getProfessionalStats(id);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verificar identidad del profesional (solo admin)' })
  @ApiResponse({ status: 200, description: 'Profesional verificado' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async verifyProfessional(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() verificationDto: any,
    @Request() req: any,
  ) {
    return this.professionalsService.verifyProfessional(id, verificationDto, req.user.id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspender profesional (solo admin)' })
  @ApiResponse({ status: 200, description: 'Profesional suspendido' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async suspendProfessional(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() suspensionDto: any,
    @Request() req: any,
  ) {
    return this.professionalsService.suspendProfessional(id, suspensionDto, req.user.id);
  }

  @Get('search/skills')
  @ApiOperation({ summary: 'Buscar profesionales por habilidades' })
  @ApiQuery({ name: 'skills', required: true, description: 'Habilidades separadas por comas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Profesionales encontrados por habilidades' })
  async searchBySkills(
    @Query('skills') skills: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const skillsArray = skills.split(',').map(skill => skill.trim());
    return this.professionalsService.searchBySkills(skillsArray, page, limit);
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Obtener profesionales mejor calificados' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Profesionales mejor calificados obtenidos' })
  async getTopRatedProfessionals(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.professionalsService.getTopRatedProfessionals(categoryId, limit);
  }
}
