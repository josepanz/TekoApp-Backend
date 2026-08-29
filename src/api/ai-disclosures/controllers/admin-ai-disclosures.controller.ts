import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { AiDisclosuresService } from '../services/ai-disclosures.service';
import { GetAiDisclosuresAdminQueryDTO } from '../dtos/request';
import { AiDisclosuresAdminListResponseDTO } from '../dtos/response';
import { ApiGetAiDisclosuresAdmin } from '../docs/ai-disclosures.docs';

@ApiTags('Disclosure de IA (staff)')
@Controller('admin/ai-disclosures')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAiDisclosuresController {
  constructor(private readonly aiDisclosuresService: AiDisclosuresService) {}

  @Get()
  @Permissions(PERMISSIONS.AI_DISCLOSURE.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  @ApiGetAiDisclosuresAdmin()
  async getAll(
    @Query() query: GetAiDisclosuresAdminQueryDTO,
  ): Promise<AiDisclosuresAdminListResponseDTO> {
    return this.aiDisclosuresService.findPaginatedForAdmin(query);
  }
}
