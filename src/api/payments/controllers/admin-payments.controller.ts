import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { DownloadFile } from '@common/decorators/file-download.decorator';
import {
  FileDownloadInterceptor,
  IDownloadResponse,
} from '@core/interceptors/file-download.interceptor';
import { PaymentApiService } from '../services/payments.service';
import { PaymentListQueryDTO } from '../dtos/request';
import { ApiExportPayments } from '../docs/payments.docs';

@ApiTags('Pagos (staff)')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminPaymentsController {
  constructor(private readonly service: PaymentApiService) {}

  @Get('export')
  @Permissions(PERMISSIONS.PAYMENTS.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  @UseInterceptors(FileDownloadInterceptor)
  @DownloadFile()
  @ApiExportPayments()
  async export(
    @Query() query: PaymentListQueryDTO,
  ): Promise<IDownloadResponse> {
    return this.service.exportToCsv(query);
  }
}
