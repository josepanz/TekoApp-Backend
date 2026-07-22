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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ProfessionalsService } from '../services/professionals.service';
import {
  ProfessionalIdParamDTO,
  ProfessionalReferenceIdParamDTO,
  GetProfessionalsListQueryDTO,
  GetNearbyProfessionalsQueryDTO,
  SearchBySkillsQueryDTO,
  GetTopRatedQueryDTO,
  GetProfessionalServicesQueryDTO,
  GetProfessionalReviewsQueryDTO,
  CreateProfessionalRequestDTO,
  UpdateProfessionalRequestDTO,
  UpdateAvailabilityRequestDTO,
  UpdateProfessionalLocationRequestDTO,
  VerifyProfessionalRequestDTO,
  SuspendProfessionalRequestDTO,
} from '../dtos/request';
import {
  ProfessionalDetailResponseDTO,
  ProfessionalsListResponseDTO,
  ProfessionalServicesListResponseDTO,
  ProfessionalReviewsListResponseDTO,
  ProfessionalStatsResponseDTO,
} from '../dtos/response';

@ApiTags('Professionals')
@Controller('professionals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo profesional' })
  @ApiResponse({ status: 201, type: ProfessionalDetailResponseDTO })
  async registerProfessional(
    @Body() dto: CreateProfessionalRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.registerProfessional(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de profesionales con filtros' })
  @ApiResponse({ status: 200, type: ProfessionalsListResponseDTO })
  async getProfessionals(
    @Query() query: GetProfessionalsListQueryDTO,
  ): Promise<ProfessionalsListResponseDTO> {
    return this.professionalsService.getProfessionals(query);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obtener profesionales cercanos por ubicación' })
  @ApiResponse({ status: 200, type: [ProfessionalDetailResponseDTO] })
  async getNearbyProfessionals(
    @Query() query: GetNearbyProfessionalsQueryDTO,
  ): Promise<ProfessionalDetailResponseDTO[]> {
    return this.professionalsService.getNearbyProfessionals(query);
  }

  @Get('search/skills')
  @ApiOperation({ summary: 'Buscar profesionales por habilidades' })
  @ApiResponse({ status: 200, type: ProfessionalsListResponseDTO })
  async searchBySkills(
    @Query() query: SearchBySkillsQueryDTO,
  ): Promise<ProfessionalsListResponseDTO> {
    return this.professionalsService.searchBySkills(query);
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Obtener profesionales mejor calificados' })
  @ApiResponse({ status: 200, type: [ProfessionalDetailResponseDTO] })
  async getTopRatedProfessionals(
    @Query() query: GetTopRatedQueryDTO,
  ): Promise<ProfessionalDetailResponseDTO[]> {
    return this.professionalsService.getTopRatedProfessionals(query);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Obtener el perfil profesional propio del usuario autenticado',
  })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  @ApiResponse({
    status: 404,
    description: 'El usuario autenticado no tiene perfil profesional',
  })
  async getMyProfessionalProfile(
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.getMyProfessionalProfile(req.user.id);
  }

  @Get('reference/:referenceId')
  @ApiOperation({ summary: 'Obtener un profesional por su referenceId' })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async getProfessionalByReference(
    @Param() param: ProfessionalReferenceIdParamDTO,
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.getProfessionalByReference(
      param.referenceId,
    );
  }

  @Put('reference/:referenceId')
  @ApiOperation({ summary: 'Actualizar perfil de profesional por referenceId' })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  async updateProfessionalByReference(
    @Param() param: ProfessionalReferenceIdParamDTO,
    @Body() dto: UpdateProfessionalRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.updateProfessionalByReference(
      param.referenceId,
      dto,
      req.user.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un profesional por ID' })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async getProfessionalById(
    @Param() param: ProfessionalIdParamDTO,
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.getProfessionalById(param.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar perfil de profesional' })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  async updateProfessional(
    @Param() param: ProfessionalIdParamDTO,
    @Body() dto: UpdateProfessionalRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.updateProfessional(
      param.id,
      dto,
      req.user.id,
    );
  }

  @Post(':id/availability')
  @ApiOperation({ summary: 'Actualizar disponibilidad del profesional' })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  async updateAvailability(
    @Param() param: ProfessionalIdParamDTO,
    @Body() dto: UpdateAvailabilityRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.updateAvailability(
      param.id,
      dto.isAvailable,
      req.user.id,
    );
  }

  @Post(':id/location')
  @ApiOperation({ summary: 'Actualizar ubicación del profesional' })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  async updateLocation(
    @Param() param: ProfessionalIdParamDTO,
    @Body() dto: UpdateProfessionalLocationRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.updateLocation(param.id, dto, req.user.id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Obtener servicios del profesional' })
  @ApiResponse({ status: 200, type: ProfessionalServicesListResponseDTO })
  async getProfessionalServices(
    @Param() param: ProfessionalIdParamDTO,
    @Query() query: GetProfessionalServicesQueryDTO,
  ): Promise<ProfessionalServicesListResponseDTO> {
    return this.professionalsService.getProfessionalServices(param.id, query);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Obtener reseñas del profesional' })
  @ApiResponse({ status: 200, type: ProfessionalReviewsListResponseDTO })
  async getProfessionalReviews(
    @Param() param: ProfessionalIdParamDTO,
    @Query() query: GetProfessionalReviewsQueryDTO,
  ): Promise<ProfessionalReviewsListResponseDTO> {
    return this.professionalsService.getProfessionalReviews(param.id, query);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del profesional' })
  @ApiResponse({ status: 200, type: ProfessionalStatsResponseDTO })
  async getProfessionalStats(
    @Param() param: ProfessionalIdParamDTO,
  ): Promise<ProfessionalStatsResponseDTO> {
    return this.professionalsService.getProfessionalStats(param.id);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verificar identidad del profesional (solo admin)' })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  async verifyProfessional(
    @Param() param: ProfessionalIdParamDTO,
    @Body() dto: VerifyProfessionalRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.verifyProfessional(
      param.id,
      dto,
      req.user.id,
    );
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspender profesional (solo admin)' })
  @ApiResponse({ status: 200, type: ProfessionalDetailResponseDTO })
  async suspendProfessional(
    @Param() param: ProfessionalIdParamDTO,
    @Body() dto: SuspendProfessionalRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<ProfessionalDetailResponseDTO> {
    return this.professionalsService.suspendProfessional(
      param.id,
      dto.reason,
      req.user.id,
    );
  }
}
