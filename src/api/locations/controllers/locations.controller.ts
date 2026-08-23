import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { LocationsService } from '../services/locations.service';
import { UpdateLocationRequestDTO } from '../dtos/request/update-location-request.dto';
import { FindNearbyQueryDTO } from '../dtos/request/find-nearby-query.dto'; // Mapeo de query unificada
import { GetProfessionalLocationParamDTO } from '../dtos/request/get-professional-location-param.dto';
import { GetProfessionalsAreaQueryDTO } from '../dtos/request/get-professionals-area-query.dto';
import { CalculateDistanceQueryDTO } from '../dtos/request/calculate-distance-query.dto';
import { SetOnlineStatusRequestDTO } from '../dtos/request/set-online-status-request.dto';
import { ProfessionalLocationResponseDTO } from '../dtos/response/professional-location-response.dto';
import { NearbyProfessionalResponseDTO } from '../dtos/response/nearby-professional-response.dto';
import { OnlineCountResponseDTO } from '../dtos/response/online-count-response.dto';
import { DistanceResponseDTO } from '../dtos/response/distance-response.dto';

@ApiTags('Ubicaciones')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar ubicación del profesional',
    description:
      'Permite a un proveedor autenticado renovar su posición geográfica.',
  })
  @ApiResponse({ status: 200, description: 'Ubicación actualizada con éxito.' })
  async updateLocation(
    @Request() req: { user: IUserDataOnJwt },
    @Body() updateLocationDto: UpdateLocationRequestDTO,
  ) {
    // El JWT nunca trae `professionalId` (era un campo inexistente en el payload real, ver
    // jwt.strategy.ts) — se resuelve contra la DB a partir del `referenceId` del User autenticado.
    const professionalId =
      await this.locationsService.resolveProfessionalIdByUserRef(
        req.user.referenceId,
      );
    return this.locationsService.updateLocation(
      professionalId,
      updateLocationDto,
    );
  }

  @Patch('online')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar el estado online del profesional autenticado',
    description:
      'true = empieza a poder emitir ubicación en vivo; false = deja de estar disponible para el mapa de cercanos.',
  })
  @ApiResponse({ status: 200, description: 'Estado online actualizado.' })
  async setOnlineStatus(
    @Request() req: { user: IUserDataOnJwt },
    @Body() dto: SetOnlineStatusRequestDTO,
  ) {
    return this.locationsService.setOnlineStatus(
      req.user.referenceId,
      dto.isOnline,
    );
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar profesionales cercanos via Haversine',
    description:
      'Retorna profesionales optimizados basados en radio y disponibilidad.',
  })
  @ApiResponse({
    status: 200,
    description: 'Colección ordenada por proximidad.',
    type: [NearbyProfessionalResponseDTO],
  })
  async findNearbyProfessionals(
    @Query() query: FindNearbyQueryDTO,
  ): Promise<NearbyProfessionalResponseDTO[]> {
    return this.locationsService.findNearbyProfessionals(query);
  }

  @Get('professional/:id')
  @ApiOperation({ summary: 'Obtener coordenadas activas de un profesional' })
  @ApiResponse({ status: 200, type: ProfessionalLocationResponseDTO })
  async getProfessionalLocation(
    @Param() param: GetProfessionalLocationParamDTO,
  ): Promise<ProfessionalLocationResponseDTO> {
    return this.locationsService.getProfessionalLocation(param.id);
  }

  @Get('online-count')
  @ApiOperation({ summary: 'Totalizar profesionales en línea concurrentes' })
  @ApiResponse({ status: 200, type: OnlineCountResponseDTO })
  async getOnlineProfessionalsCount(): Promise<OnlineCountResponseDTO> {
    const count = await this.locationsService.getOnlineProfessionalsCount();
    return { count };
  }

  @Get('area')
  @ApiOperation({
    summary:
      'Filtrar profesionales inscritos dentro de un área bounding-box cuadrangular',
  })
  async getProfessionalsByArea(@Query() query: GetProfessionalsAreaQueryDTO) {
    return this.locationsService.getProfessionalsByArea(query);
  }

  @Get('distance')
  @ApiOperation({
    summary:
      'Calcular distancia geodésica escalar entre dos puntos coordenados autónomos',
  })
  @ApiResponse({ status: 200, type: DistanceResponseDTO })
  calculateDistance(
    @Query() query: CalculateDistanceQueryDTO,
  ): DistanceResponseDTO {
    const distance = this.locationsService.calculateDistance(query);
    return { distance: Math.round(distance * 100) / 100, unit: 'km' };
  }
}
