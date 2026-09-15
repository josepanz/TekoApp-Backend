import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { AuditLogService } from '../services/audit-log.service';
import { GetAuditLogsQueryDTO } from '../dtos/request';
import { AuditLogsListResponseDTO } from '../dtos/response';
import { ApiGetAuditLogs } from '../docs/audit-log.docs';

@ApiTags('Auditoría (staff)')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAuditLogController {
  constructor(private readonly service: AuditLogService) {}

  @Get()
  @Permissions(PERMISSIONS.SYSTEM.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  @ApiGetAuditLogs()
  async list(
    @Query() query: GetAuditLogsQueryDTO,
  ): Promise<AuditLogsListResponseDTO> {
    return this.service.list(query);
  }
}
