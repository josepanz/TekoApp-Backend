import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';

import { t } from '@common/i18n/i18n.helper';
export class CustomHttpResponseHelper {
  private static logger = new Logger(CustomHttpResponseHelper.name);

  static handleResponse(response: AxiosResponse): never {
    const status: HttpStatus = response.status;
    const statusText = response.statusText;

    switch (status) {
      case HttpStatus.NOT_FOUND:
        this.logger.warn(
          `No se encontraron datos para los parámetros proporcionados: ${status} - ${statusText}`,
        );
        throw new NotFoundException(t('common.NO_DATA_FOR_PARAMETERS'));

      case HttpStatus.BAD_REQUEST:
        this.logger.warn(
          `Solicitud mal formada, verifique los datos y/o parámetros enviados: ${status} - ${statusText}`,
        );
        throw new BadRequestException(t('common.MALFORMED_REQUEST'));

      case HttpStatus.UNAUTHORIZED:
        this.logger.warn(`Credenciales inválidas: ${status} - ${statusText}`);
        throw new UnauthorizedException(t('common.INVALID_CREDENTIALS'));

      case HttpStatus.FORBIDDEN:
        this.logger.warn(`Usuario bloqueado: ${status} - ${statusText}`);
        throw new ForbiddenException(t('common.FORBIDDEN_USER_BLOCKED'));

      case HttpStatus.INTERNAL_SERVER_ERROR:
        this.logger.warn(
          `Error interno del servidor al procesar la solicitud: ${status} - ${statusText}`,
        );
        throw new InternalServerErrorException(
          t('common.UPSTREAM_INTERNAL_ERROR'),
        );

      default:
        this.logger.error(
          `Error inesperado en la respuesta HTTP: ${status} - ${statusText}`,
        );
        throw new HttpException(
          t('common.UNEXPECTED_RESPONSE', { statusText }),
          status,
        );
    }
  }

  /**
   * Manejo de errores de red / axios (cuando axios lanza excepción).
   */
  static handleAxiosError(error: AxiosError): never {
    if (error.response) {
      // Hubo respuesta con status != 2xx → lo manejamos con handleResponse
      this.handleResponse(error.response);
    }

    if (error.code === 'ECONNABORTED') {
      this.logger.error('Timeout al conectar con el servidor externo.');
      throw new GatewayTimeoutException(t('common.EXTERNAL_TIMEOUT'));
    }

    if (error.code === 'ECONNREFUSED') {
      this.logger.error('Conexión rechazada por el servidor externo.');
      throw new ServiceUnavailableException(
        t('common.EXTERNAL_CONNECTION_REFUSED'),
      );
    }

    if (error.code === 'ENOTFOUND') {
      this.logger.error('Servidor externo no encontrado.');
      throw new BadGatewayException(t('common.BAD_GATEWAY'));
    }

    this.logger.error(`Error desconocido de Axios: ${error.message}`);
    throw new InternalServerErrorException(t('common.UNKNOWN_REQUEST_ERROR'));
  }
}
