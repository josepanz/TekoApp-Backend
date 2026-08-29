import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { ContractsService } from '../services/contracts.service';
import { GetAdminContractsQueryDTO } from '../dtos/request';
import { ContractsAuditListResponseDTO } from '../dtos/response';
import { ApiGetAdminContracts } from '../docs/contracts.docs';

@ApiTags('Contratos (staff)')
@Controller('admin/contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get()
  @Permissions(PERMISSIONS.CONTRACTS.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  @ApiGetAdminContracts()
  async list(
    @Query() query: GetAdminContractsQueryDTO,
  ): Promise<ContractsAuditListResponseDTO> {
    return this.service.listAudit(query);
  }
}
