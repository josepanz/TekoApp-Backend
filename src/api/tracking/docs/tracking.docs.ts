// src/api/tracking/docs/tracking.docs.ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateLocationResponseDTO } from '../dtos/response/update-location.response.dto';
import { GetNearbyProfessionalsResponseDTO } from '../dtos/response/get-nearby-professionals.response.dto';
import { HttpResponseDOC } from '@/common/docs/http-response.doc';

export function ApplyTrackingControllerDocs() {
  return applyDecorators(ApiTags('Tracking & Telemetría'));
}

export function ApplyPingDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar tracking continuo del celular del proveedor',
    }),
    ApiCreatedResponse({
      description: 'Ping de localización procesado de manera correcta.',
      type: UpdateLocationResponseDTO,
    }),
    HttpResponseDOC(),
  );
}

export function ApplyNearbyDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Buscar proveedores activos dentro de un rango espacial',
    }),
    ApiOkResponse({
      description: 'Lista de proveedores cercanos encontrada con éxito.',
      type: GetNearbyProfessionalsResponseDTO,
    }),
    HttpResponseDOC(),
  );
}
