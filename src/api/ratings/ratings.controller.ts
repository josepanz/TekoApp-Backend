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
import { Rating } from './entities/rating.entity';
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
  @ApiOperation({
    summary: 'Crear una nueva calificación',
    description: 'Permite a un usuario calificar un servicio o profesional',
  })
  @ApiResponse({
    status: 201,
    description: 'Calificación creada exitosamente',
    type: Rating,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o calificación duplicada',
  })
  async create(
    @Request() req,
    @Body() createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    return this.ratingsService.create(req.user.id, createRatingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las calificaciones',
    description:
      'Retorna una lista paginada de todas las calificaciones del sistema',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de elementos por página',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de calificaciones obtenida exitosamente',
    type: [Rating],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<Rating[]> {
    return this.ratingsService.findAll();
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Obtener calificaciones recientes',
    description: 'Retorna las calificaciones más recientes del sistema',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de calificaciones a retornar',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones recientes obtenidas exitosamente',
    type: [Rating],
  })
  async getRecentRatings(
    @Query('limit') limit: number = 20,
  ): Promise<Rating[]> {
    return this.ratingsService.getRecentRatings(limit);
  }

  @Get('top-professionals')
  @ApiOperation({
    summary: 'Obtener profesionales mejor calificados',
    description:
      'Retorna una lista de profesionales ordenados por calificación promedio',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de profesionales a retornar',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de profesionales mejor calificados obtenida exitosamente',
    type: [TopRatedProfessionalDto],
  })
  async getTopRatedProfessionals(
    @Query('limit') limit: number = 10,
  ): Promise<TopRatedProfessionalDto[]> {
    return this.ratingsService.getTopRatedProfessionals(limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una calificación específica',
    description: 'Retorna los detalles de una calificación por su ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificación encontrada exitosamente',
    type: Rating,
  })
  @ApiResponse({
    status: 404,
    description: 'Calificación no encontrada',
  })
  async findOne(@Param('id') id: string): Promise<Rating> {
    return this.ratingsService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Obtener calificaciones de un usuario',
    description:
      'Retorna todas las calificaciones realizadas por un usuario específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones del usuario obtenidas exitosamente',
    type: [Rating],
  })
  async findByUser(@Param('userId') userId: string): Promise<Rating[]> {
    return this.ratingsService.findByUser(userId);
  }

  @Get('professional/:professionalId')
  @ApiOperation({
    summary: 'Obtener calificaciones de un profesional',
    description:
      'Retorna todas las calificaciones recibidas por un profesional',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones del profesional obtenidas exitosamente',
    type: [Rating],
  })
  async findByProfessional(
    @Param('professionalId') professionalId: string,
  ): Promise<Rating[]> {
    return this.ratingsService.findByProfessional(professionalId);
  }

  @Get('professional/:professionalId/client-ratings')
  @ApiOperation({
    summary: 'Obtener calificaciones de clientes a un profesional',
    description:
      'Retorna solo las calificaciones que los clientes han hecho a un profesional',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones de clientes obtenidas exitosamente',
    type: [Rating],
  })
  async getClientRatings(
    @Param('professionalId') professionalId: string,
  ): Promise<Rating[]> {
    return this.ratingsService.findClientRatings(professionalId);
  }

  @Get('professional/:professionalId/average')
  @ApiOperation({
    summary: 'Obtener calificación promedio de un profesional',
    description:
      'Retorna estadísticas detalladas de calificaciones de un profesional',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de calificaciones obtenidas exitosamente',
    type: ProfessionalRatingStatsDto,
  })
  async getAverageRating(
    @Param('professionalId') professionalId: string,
  ): Promise<ProfessionalRatingStatsDto> {
    return this.ratingsService.getAverageRating(professionalId);
  }

  @Get('user/:userId/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de calificaciones de un usuario',
    description:
      'Retorna estadísticas de calificaciones dadas y recibidas por un usuario',
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
    description:
      'Retorna todas las calificaciones relacionadas con una solicitud de servicio específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones de la solicitud obtenidas exitosamente',
    type: [Rating],
  })
  async findByServiceRequest(
    @Param('serviceRequestId') serviceRequestId: string,
  ): Promise<Rating[]> {
    return this.ratingsService.findByServiceRequest(serviceRequestId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una calificación',
    description:
      'Permite a un usuario editar su calificación dentro de las primeras 24 horas',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificación actualizada exitosamente',
    type: Rating,
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
    @Request() req,
    @Body() updateRatingDto: UpdateRatingDto,
  ): Promise<Rating> {
    return this.ratingsService.update(id, req.user.id, updateRatingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una calificación',
    description:
      'Permite a un usuario eliminar su calificación si cumple las condiciones',
  })
  @ApiResponse({
    status: 204,
    description: 'Calificación eliminada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar esta calificación',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para eliminar esta calificación',
  })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.ratingsService.remove(id, req.user.id);
  }

  @Post(':id/report')
  @ApiOperation({
    summary: 'Reportar una calificación',
    description: 'Permite reportar una calificación inapropiada o falsa',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificación reportada exitosamente',
    type: Rating,
  })
  @ApiResponse({
    status: 400,
    description: 'No puedes reportar tu propia calificación',
  })
  async reportRating(
    @Param('id') id: string,
    @Request() req,
    @Body() reportRatingDto: ReportRatingDto,
  ): Promise<Rating> {
    return this.ratingsService.reportRating(
      id,
      req.user.id,
      reportRatingDto.reason,
    );
  }
}
