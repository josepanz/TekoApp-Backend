import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocationsService } from './locations.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';
import { Professional } from '../professionals/entities/professional.entity';

@ApiTags('Ubicaciones')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar ubicación del profesional',
    description: 'Permite a un profesional actualizar su ubicación actual en tiempo real',
  })
  @ApiResponse({
    status: 200,
    description: 'Ubicación actualizada exitosamente',
    type: Professional,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 404,
    description: 'Profesional no encontrado',
  })
  async updateLocation(
    @Request() req,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Professional> {
    const professionalId = req.user.professionalId;
    return this.locationsService.updateLocation(professionalId, updateLocationDto);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar profesionales cercanos',
    description: 'Encuentra profesionales disponibles en un radio específico desde una ubicación',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de profesionales cercanos encontrados',
    type: [Professional],
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de búsqueda inválidos',
  })
  async findNearbyProfessionals(
    @Query() findNearbyDto: FindNearbyDto,
  ): Promise<Professional[]> {
    return this.locationsService.findNearbyProfessionals(findNearbyDto);
  }

  @Get('professional/:id')
  @ApiOperation({
    summary: 'Obtener ubicación de un profesional',
    description: 'Retorna la ubicación actual de un profesional específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Ubicación del profesional',
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', example: -25.2637 },
        longitude: { type: 'number', example: -57.5759 },
        lastUpdate: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Profesional no encontrado o sin ubicación',
  })
  async getProfessionalLocation(@Query('id') professionalId: string) {
    return this.locationsService.getProfessionalLocation(professionalId);
  }

  @Get('online-count')
  @ApiOperation({
    summary: 'Contar profesionales en línea',
    description: 'Retorna el número total de profesionales disponibles y en línea',
  })
  @ApiResponse({
    status: 200,
    description: 'Número de profesionales en línea',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 25 },
      },
    },
  })
  async getOnlineProfessionalsCount() {
    const count = await this.locationsService.getOnlineProfessionalsCount();
    return { count };
  }

  @Get('area')
  @ApiOperation({
    summary: 'Buscar profesionales por área geográfica',
    description: 'Encuentra profesionales en un área rectangular específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de profesionales en el área especificada',
    type: [Professional],
  })
  async getProfessionalsByArea(
    @Query('minLat') minLat: number,
    @Query('maxLat') maxLat: number,
    @Query('minLng') minLng: number,
    @Query('maxLng') maxLng: number,
  ): Promise<Professional[]> {
    return this.locationsService.getProfessionalsByArea(minLat, maxLat, minLng, maxLng);
  }

  @Get('distance')
  @ApiOperation({
    summary: 'Calcular distancia entre dos puntos',
    description: 'Calcula la distancia en kilómetros entre dos coordenadas geográficas',
  })
  @ApiResponse({
    status: 200,
    description: 'Distancia calculada en kilómetros',
    schema: {
      type: 'object',
      properties: {
        distance: { type: 'number', example: 5.2 },
        unit: { type: 'string', example: 'km' },
      },
    },
  })
  async calculateDistance(
    @Query('lat1') lat1: number,
    @Query('lng1') lng1: number,
    @Query('lat2') lat2: number,
    @Query('lng2') lng2: number,
  ) {
    const distance = await this.locationsService.calculateDistance(lat1, lng1, lat2, lng2);
    return { distance, unit: 'km' };
  }
}
