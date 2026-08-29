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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RatingsService } from '../services/ratings.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@auth/interfaces/user-data-on-jwt.interface';
import {
  CreateRatingRequestDTO,
  CreateProfessionalToClientRatingRequestDTO,
  UpdateRatingRequestDTO,
  ReportRatingRequestDTO,
  RatingIdParamDTO,
  UserIdParamDTO,
  ProfessionalIdRatingParamDTO,
  ServiceRequestIdParamDTO,
  GetRecentRatingsQueryDTO,
  GetTopRatedProfessionalsQueryDTO,
} from '../dtos/request';
import {
  RatingDetailResponseDTO,
  ProfessionalRatingStatsResponseDTO,
  UserRatingStatsResponseDTO,
  TopRatedProfessionalResponseDTO,
} from '../dtos/response';
import {
  CreateRatingDocs,
  CreateProfessionalToClientRatingDocs,
  FindAllRatingsDocs,
  GetRecentRatingsDocs,
  GetTopRatedProfessionalsDocs,
  FindByUserDocs,
  GetUserRatingStatsDocs,
  GetMyRatingStatsDocs,
  FindByProfessionalDocs,
  GetClientRatingsDocs,
  GetAverageRatingDocs,
  FindByServiceRequestDocs,
  FindOneRatingDocs,
  UpdateRatingDocs,
  RemoveRatingDocs,
  ReportRatingDocs,
} from '../docs/ratings.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('Ratings - Sistema de Calificaciones')
@Controller('ratings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @CreateRatingDocs()
  async create(
    @Request() req: { user: { id: number } },
    @Body() createRatingDto: CreateRatingRequestDTO,
  ): Promise<RatingDetailResponseDTO> {
    return this.ratingsService.create(req.user.id, createRatingDto);
  }

  @Post('professional-to-client')
  @CreateProfessionalToClientRatingDocs()
  async createProfessionalToClientRating(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateProfessionalToClientRatingRequestDTO,
  ): Promise<RatingDetailResponseDTO> {
    return this.ratingsService.createProfessionalToClientRating(
      req.user.id,
      dto,
    );
  }

  // Único endpoint sin masking de identidad — ve TODO (trazabilidad legal/disputas), por eso
  // requiere un permiso de auditoría explícito, no solo estar logueado.
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.RATINGS.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  @FindAllRatingsDocs()
  async findAll(): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findAll();
  }

  @Get('recent')
  @GetRecentRatingsDocs()
  async getRecentRatings(
    @Request() req: RequestWithUser,
    @Query() query: GetRecentRatingsQueryDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.getRecentRatings(query.limit, req.user);
  }

  @Get('top-professionals')
  @GetTopRatedProfessionalsDocs()
  async getTopRatedProfessionals(
    @Query() query: GetTopRatedProfessionalsQueryDTO,
  ): Promise<TopRatedProfessionalResponseDTO[]> {
    return this.ratingsService.getTopRatedProfessionals(query.limit);
  }

  @Get('user/:userId')
  @FindByUserDocs()
  async findByUser(
    @Request() req: RequestWithUser,
    @Param() param: UserIdParamDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findByUser(param.userId, req.user);
  }

  @Get('user/:userId/stats')
  @GetUserRatingStatsDocs()
  async getUserRatingStats(
    @Param() param: UserIdParamDTO,
  ): Promise<UserRatingStatsResponseDTO> {
    return this.ratingsService.getUserRatingStats(String(param.userId));
  }

  // Antes de `user/:userId`/`professional/:professionalId` a propósito — `me/stats` es un
  // segmento fijo de 2 partes, no colisiona con esas rutas param, pero se agrupa acá por
  // legibilidad (mismo dato que `getUserRatingStats`, sin necesitar el id interno del cliente).
  @Get('me/stats')
  @GetMyRatingStatsDocs()
  async getMyRatingStats(
    @Request() req: RequestWithUser,
  ): Promise<UserRatingStatsResponseDTO> {
    return this.ratingsService.getUserRatingStats(req.user.id);
  }

  @Get('professional/:professionalId')
  @FindByProfessionalDocs()
  async findByProfessional(
    @Request() req: RequestWithUser,
    @Param() param: ProfessionalIdRatingParamDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findByProfessional(
      param.professionalId,
      req.user,
    );
  }

  @Get('professional/:professionalId/client-ratings')
  @GetClientRatingsDocs()
  async getClientRatings(
    @Request() req: RequestWithUser,
    @Param() param: ProfessionalIdRatingParamDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findClientRatings(
      param.professionalId,
      req.user,
    );
  }

  @Get('professional/:professionalId/average')
  @GetAverageRatingDocs()
  async getAverageRating(
    @Param() param: ProfessionalIdRatingParamDTO,
  ): Promise<ProfessionalRatingStatsResponseDTO> {
    return this.ratingsService.getAverageRating(param.professionalId);
  }

  @Get('service/:serviceRequestId')
  @FindByServiceRequestDocs()
  async findByServiceRequest(
    @Request() req: RequestWithUser,
    @Param() param: ServiceRequestIdParamDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findByServiceRequest(
      param.serviceRequestId,
      req.user,
    );
  }

  @Get(':id')
  @FindOneRatingDocs()
  async findOne(
    @Request() req: RequestWithUser,
    @Param() param: RatingIdParamDTO,
  ): Promise<RatingDetailResponseDTO> {
    return this.ratingsService.findOne(param.id, req.user);
  }

  @Patch(':id')
  @UpdateRatingDocs()
  async update(
    @Param() param: RatingIdParamDTO,
    @Request() req: RequestWithUser,
    @Body() updateRatingDto: UpdateRatingRequestDTO,
  ): Promise<RatingDetailResponseDTO> {
    return this.ratingsService.update(param.id, req.user, updateRatingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RemoveRatingDocs()
  async remove(
    @Param() param: RatingIdParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    await this.ratingsService.remove(param.id, req.user);
  }

  @Post(':id/report')
  @ReportRatingDocs()
  async reportRating(
    @Param() param: RatingIdParamDTO,
    @Request() req: RequestWithUser,
    @Body() reportRatingDto: ReportRatingRequestDTO,
  ): Promise<RatingDetailResponseDTO> {
    return this.ratingsService.reportRating(
      param.id,
      req.user,
      reportRatingDto.reason,
    );
  }
}
