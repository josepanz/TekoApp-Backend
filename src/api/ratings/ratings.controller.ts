import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { ReportRatingDto } from './dto/report-rating.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import {
  ProfessionalRatingStatsDto,
  UserRatingStatsDto,
  TopRatedProfessionalDto,
} from './dto/rating-stats.dto';

@ApiTags('Ratings - Sistema de Calificaciones')
@Controller('ratings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva calificación' })
  @ApiResponse({ status: 201, description: 'Calificación creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o calificación duplicada',
  })
  async create(
    @Request() req: { user: { id: number } },
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.create(req.user.id, createRatingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las calificaciones' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de calificaciones obtenida exitosamente',
  })
  async findAll() {
    return this.ratingsService.findAll();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obtener calificaciones recientes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones recientes obtenidas exitosamente',
  })
  async getRecentRatings(@Query('limit') limit: number = 20) {
    return this.ratingsService.getRecentRatings(limit);
  }

  @Get('top-professionals')
  @ApiOperation({ summary: 'Obtener profesionales mejor calificados' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de profesionales mejor calificados',
    type: [TopRatedProfessionalDto],
  })
  async getTopRatedProfessionals(
    @Query('limit') limit: number = 10,
  ): Promise<TopRatedProfessionalDto[]> {
    return this.ratingsService.getTopRatedProfessionals(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una calificación específica' })
  @ApiResponse({
    status: 200,
    description: 'Calificación encontrada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.ratingsService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener calificaciones de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones del usuario obtenidas exitosamente',
  })
  async findByUser(@Param('userId') userId: string) {
    return this.ratingsService.findByUser(Number(userId));
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Obtener calificaciones de un profesional' })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones del profesional obtenidas exitosamente',
  })
  async findByProfessional(@Param('professionalId') professionalId: string) {
    return this.ratingsService.findByProfessional(Number(professionalId));
  }

  @Get('professional/:professionalId/client-ratings')
  @ApiOperation({
    summary: 'Obtener calificaciones de clientes a un profesional',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones de clientes obtenidas exitosamente',
  })
  async getClientRatings(@Param('professionalId') professionalId: string) {
    return this.ratingsService.findClientRatings(Number(professionalId));
  }

  @Get('professional/:professionalId/average')
  @ApiOperation({ summary: 'Obtener calificación promedio de un profesional' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de calificaciones obtenidas',
    type: ProfessionalRatingStatsDto,
  })
  async getAverageRating(
    @Param('professionalId') professionalId: string,
  ): Promise<ProfessionalRatingStatsDto> {
    return this.ratingsService.getAverageRating(Number(professionalId));
  }

  @Get('user/:userId/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de calificaciones de un usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del usuario obtenidas exitosamente',
    type: UserRatingStatsDto,
  })
  async getUserRatingStats(
    @Param('userId') userId: string,
  ): Promise<UserRatingStatsDto> {
    return this.ratingsService.getUserRatingStats(userId);
  }

  @Get('service/:serviceRequestId')
  @ApiOperation({
    summary: 'Obtener calificaciones de una solicitud de servicio',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones de la solicitud obtenidas exitosamente',
  })
  async findByServiceRequest(
    @Param('serviceRequestId') serviceRequestId: string,
  ) {
    return this.ratingsService.findByServiceRequest(serviceRequestId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una calificación' })
  @ApiResponse({
    status: 200,
    description: 'Calificación actualizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede editar la calificación después de 24 horas',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para editar esta calificación',
  })
  async update(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
    @Body() updateRatingDto: UpdateRatingDto,
  ) {
    return this.ratingsService.update(id, req.user.id, updateRatingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una calificación' })
  @ApiResponse({
    status: 204,
    description: 'Calificación eliminada exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para eliminar esta calificación',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
  ): Promise<void> {
    await this.ratingsService.remove(id, req.user.id);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Reportar una calificación' })
  @ApiResponse({
    status: 200,
    description: 'Calificación reportada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No puedes reportar tu propia calificación',
  })
  async reportRating(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
    @Body() reportRatingDto: ReportRatingDto,
  ) {
    return this.ratingsService.reportRating(
      id,
      req.user.id,
      reportRatingDto.reason,
    );
  }
}
