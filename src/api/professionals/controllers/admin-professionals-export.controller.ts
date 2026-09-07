import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { DownloadFile } from '@common/decorators/file-download.decorator';
import {
  FileDownloadInterceptor,
  IDownloadResponse,
} from '@core/interceptors/file-download.interceptor';
import { ProfessionalsService } from '../services/professionals.service';
import { GetProfessionalsListQueryDTO } from '../dtos/request';

@ApiTags('Professionals (staff)')
@Controller('admin/professionals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminProfessionalsExportController {
  constructor(private readonly service: ProfessionalsService) {}

  @Get('export')
  @Permissions(PERMISSIONS.PROFESSIONALS.VERIFY, PERMISSIONS.ADMIN.ALL)
  @UseInterceptors(FileDownloadInterceptor)
  @DownloadFile()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Exportar profesionales a CSV (staff)',
    description: 'Mismos filtros que el listado público, sin paginar.',
  })
  @ApiResponse({ status: 200, description: 'Archivo CSV de profesionales' })
  async export(
    @Query() query: GetProfessionalsListQueryDTO,
  ): Promise<IDownloadResponse> {
    return this.service.exportToCsv(query);
  }
}
