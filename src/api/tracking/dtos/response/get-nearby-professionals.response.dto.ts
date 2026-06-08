// src/api/tracking/dtos/response/get-nearby-professionals.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class GeoLocationCoordinatesDTO {
  @ApiProperty({ description: 'Tipo de objeto geoespacial', example: 'Point' })
  type!: string;

  @ApiProperty({
    description: 'Coordenadas en formato GeoJSON [Longitud, Latitud]',
    example: [-57.6225, -25.2912],
    type: [Number],
  })
  coordinates!: number[];
}

class NearbyProfessionalDataDTO {
  @ApiProperty({ description: 'ID del profesional', example: 125 })
  professionalId!: number;

  @ApiProperty({ description: 'Objeto de localización GeoJSON estructural' })
  location!: GeoLocationCoordinatesDTO;

  @ApiProperty({
    description: 'Última fecha de actualización',
    example: '2026-06-07T18:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Dirección o rumbo del proveedor',
    example: 120,
    required: false,
  })
  heading?: number;

  @ApiProperty({
    description: 'Velocidad actual del proveedor',
    example: 0,
    required: false,
  })
  speed?: number;
}

class GetNearbyProfessionalsMetaDTO {
  @ApiProperty({
    description: 'Radio final aplicado en la consulta en Kilómetros',
    example: 10,
  })
  radiusAppliedKm!: number;

  @ApiProperty({
    description: 'Cantidad total de registros encontrados',
    example: 3,
  })
  resultsCount!: number;
}

export class GetNearbyProfessionalsResponseDTO {
  @ApiProperty({ description: 'Estado de la respuesta', example: true })
  success!: boolean;

  @ApiProperty({
    description: 'Metadatos de la paginación o ámbito de búsqueda',
  })
  meta!: GetNearbyProfessionalsMetaDTO;

  @ApiProperty({
    description: 'Lista de profesionales mapeados dentro del rango espacial',
    type: [NearbyProfessionalDataDTO],
  })
  data!: NearbyProfessionalDataDTO[];
}
