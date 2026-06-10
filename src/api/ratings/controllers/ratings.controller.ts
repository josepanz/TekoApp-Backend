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
import {
  CreateRatingRequestDTO,
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
  FindAllRatingsDocs,
  GetRecentRatingsDocs,
  GetTopRatedProfessionalsDocs,
  FindByUserDocs,
  GetUserRatingStatsDocs,
  FindByProfessionalDocs,
  GetClientRatingsDocs,
  GetAverageRatingDocs,
  FindByServiceRequestDocs,
  FindOneRatingDocs,
  UpdateRatingDocs,
  RemoveRatingDocs,
  ReportRatingDocs,
} from '../docs/ratings.docs';

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
    return this.ratingsService.create(
      req.user.id,
      createRatingDto,
    ) as unknown as Promise<RatingDetailResponseDTO>;
  }

  @Get()
  @FindAllRatingsDocs()
  async findAll(): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findAll() as unknown as Promise<
      RatingDetailResponseDTO[]
    >;
  }

  @Get('recent')
  @GetRecentRatingsDocs()
  async getRecentRatings(
    @Query() query: GetRecentRatingsQueryDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.getRecentRatings(
      query.limit,
    ) as unknown as Promise<RatingDetailResponseDTO[]>;
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
    @Param() param: UserIdParamDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findByUser(param.userId) as unknown as Promise<
      RatingDetailResponseDTO[]
    >;
  }

  @Get('user/:userId/stats')
  @GetUserRatingStatsDocs()
  async getUserRatingStats(
    @Param() param: UserIdParamDTO,
  ): Promise<UserRatingStatsResponseDTO> {
    return this.ratingsService.getUserRatingStats(String(param.userId));
  }

  @Get('professional/:professionalId')
  @FindByProfessionalDocs()
  async findByProfessional(
    @Param() param: ProfessionalIdRatingParamDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findByProfessional(
      param.professionalId,
    ) as unknown as Promise<RatingDetailResponseDTO[]>;
  }

  @Get('professional/:professionalId/client-ratings')
  @GetClientRatingsDocs()
  async getClientRatings(
    @Param() param: ProfessionalIdRatingParamDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findClientRatings(
      param.professionalId,
    ) as unknown as Promise<RatingDetailResponseDTO[]>;
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
    @Param() param: ServiceRequestIdParamDTO,
  ): Promise<RatingDetailResponseDTO[]> {
    return this.ratingsService.findByServiceRequest(
      param.serviceRequestId,
    ) as unknown as Promise<RatingDetailResponseDTO[]>;
  }

  @Get(':id')
  @FindOneRatingDocs()
  async findOne(
    @Param() param: RatingIdParamDTO,
  ): Promise<RatingDetailResponseDTO> {
    return this.ratingsService.findOne(
      param.id,
    ) as unknown as Promise<RatingDetailResponseDTO>;
  }

  @Patch(':id')
  @UpdateRatingDocs()
  async update(
    @Param() param: RatingIdParamDTO,
    @Request() req: { user: { id: number } },
    @Body() updateRatingDto: UpdateRatingRequestDTO,
  ): Promise<RatingDetailResponseDTO> {
    return this.ratingsService.update(
      param.id,
      req.user.id,
      updateRatingDto,
    ) as unknown as Promise<RatingDetailResponseDTO>;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RemoveRatingDocs()
  async remove(
    @Param() param: RatingIdParamDTO,
    @Request() req: { user: { id: number } },
  ): Promise<void> {
    await this.ratingsService.remove(param.id, req.user.id);
  }

  @Post(':id/report')
  @ReportRatingDocs()
  async reportRating(
    @Param() param: RatingIdParamDTO,
    @Request() req: { user: { id: number } },
    @Body() reportRatingDto: ReportRatingRequestDTO,
  ): Promise<RatingDetailResponseDTO> {
    return this.ratingsService.reportRating(
      param.id,
      req.user.id,
      reportRatingDto.reason,
    ) as unknown as Promise<RatingDetailResponseDTO>;
  }
}
