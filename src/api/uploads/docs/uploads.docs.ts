import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInfoResponseDTO } from '../dtos/response';

export const UploadImageDocs = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Sube una imagen y la almacena en S3. Optimiza con Sharp si está disponible.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: { file: { type: 'string', format: 'binary' } },
      },
    }),
    ApiResponse({ status: 201, type: FileInfoResponseDTO }),
  );

export const UploadDocumentDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Sube un documento (PDF, Word) y lo almacena en S3.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: { file: { type: 'string', format: 'binary' } },
      },
    }),
    ApiResponse({ status: 201, type: FileInfoResponseDTO }),
  );

export const UploadAvatarDocs = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Sube un avatar (solo imágenes). Crea thumbnail 150x150 automáticamente.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: { file: { type: 'string', format: 'binary' } },
      },
    }),
    ApiResponse({ status: 201, type: FileInfoResponseDTO }),
  );

export const UploadMerchantDocsDocs = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Sube documentos de onboarding de merchant a S3 y actualiza los datos de documento del usuario.',
    }),
    ApiResponse({
      status: 201,
      description: 'Documentos subidos exitosamente.',
    }),
  );

export const GetPresignedUrlDocs = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Genera una URL presignada de acceso temporal para un archivo en S3.',
    }),
    ApiResponse({
      status: 200,
      schema: { type: 'object', properties: { url: { type: 'string' } } },
    }),
  );

export const DeleteFileDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Elimina un archivo de S3 por su clave.' }),
    ApiResponse({
      status: 200,
      schema: { type: 'object', properties: { message: { type: 'string' } } },
    }),
  );
