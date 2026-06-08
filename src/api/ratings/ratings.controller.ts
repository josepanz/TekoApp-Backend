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
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { ReportRatingDto } from './dto/report-rating.dto';
import {
  ProfessionalRatingStatsDto,
  UserRatingStatsDto,
  TopRatedProfessionalDto,
} from './dto/rating-stats.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import {
  RatingIdParamDTO,
  UserIdParamDTO,
  ProfessionalIdRatingParamDTO,
  ServiceRequestIdParamDTO,
  GetRecentRatingsQueryDTO,
  GetTopRatedProfessionalsQueryDTO,
} from './dto';

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
  @ApiResponse({
    status: 200,
    description: 'Lista de calificaciones obtenida exitosamente',
  })
  async findAll() {
    return this.ratingsService.findAll();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obtener calificaciones recientes' })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones recientes obtenidas exitosamente',
  })
  async getRecentRatings(@Query() query: GetRecentRatingsQueryDTO) {
    return this.ratingsService.getRecentRatings(query.limit);
  }

  @Get('top-professionals')
  @ApiOperation({ summary: 'Obtener profesionales mejor calificados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de profesionales mejor calificados',
    type: [TopRatedProfessionalDto],
  })
  async getTopRatedProfessionals(
    @Query() query: GetTopRatedProfessionalsQueryDTO,
  ): Promise<TopRatedProfessionalDto[]> {
    return this.ratingsService.getTopRatedProfessionals(query.limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener calificaciones de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones del usuario obtenidas exitosamente',
  })
  async findByUser(@Param() param: UserIdParamDTO) {
    return this.ratingsService.findByUser(param.userId);
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
    @Param() param: UserIdParamDTO,
  ): Promise<UserRatingStatsDto> {
    return this.ratingsService.getUserRatingStats(String(param.userId));
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Obtener calificaciones de un profesional' })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones del profesional obtenidas exitosamente',
  })
  async findByProfessional(@Param() param: ProfessionalIdRatingParamDTO) {
    return this.ratingsService.findByProfessional(param.professionalId);
  }

  @Get('professional/:professionalId/client-ratings')
  @ApiOperation({
    summary: 'Obtener calificaciones de clientes a un profesional',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones de clientes obtenidas exitosamente',
  })
  async getClientRatings(@Param() param: ProfessionalIdRatingParamDTO) {
    return this.ratingsService.findClientRatings(param.professionalId);
  }

  @Get('professional/:professionalId/average')
  @ApiOperation({ summary: 'Obtener calificación promedio de un profesional' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de calificaciones obtenidas',
    type: ProfessionalRatingStatsDto,
  })
  async getAverageRating(
    @Param() param: ProfessionalIdRatingParamDTO,
  ): Promise<ProfessionalRatingStatsDto> {
    return this.ratingsService.getAverageRating(param.professionalId);
  }

  @Get('service/:serviceRequestId')
  @ApiOperation({
    summary: 'Obtener calificaciones de una solicitud de servicio',
  })
  @ApiResponse({
    status: 200,
    description: 'Calificaciones de la solicitud obtenidas exitosamente',
  })
  async findByServiceRequest(@Param() param: ServiceRequestIdParamDTO) {
    return this.ratingsService.findByServiceRequest(param.serviceRequestId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una calificación específica' })
  @ApiResponse({
    status: 200,
    description: 'Calificación encontrada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada' })
  async findOne(@Param() param: RatingIdParamDTO) {
    return this.ratingsService.findOne(param.id);
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
    @Param() param: RatingIdParamDTO,
    @Request() req: { user: { id: number } },
    @Body() updateRatingDto: UpdateRatingDto,
  ) {
    return this.ratingsService.update(param.id, req.user.id, updateRatingDto);
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
    @Param() param: RatingIdParamDTO,
    @Request() req: { user: { id: number } },
  ): Promise<void> {
    await this.ratingsService.remove(param.id, req.user.id);
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
    @Param() param: RatingIdParamDTO,
    @Request() req: { user: { id: number } },
    @Body() reportRatingDto: ReportRatingDto,
  ) {
    return this.ratingsService.reportRating(
      param.id,
      req.user.id,
      reportRatingDto.reason,
    );
  }
}
