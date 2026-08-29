import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { MaterialCatalogService } from '../services/material-catalog.service';
import {
  CreateMaterialCatalogItemRequestDTO,
  GetMaterialCatalogListQueryDTO,
  MaterialCatalogItemReferenceParamDTO,
  UpdateMaterialCatalogItemRequestDTO,
} from '../dtos/request';
import {
  MaterialCatalogItemResponseDTO,
  MaterialCatalogListResponseDTO,
} from '../dtos/response';
import {
  ApiCreateMaterialCatalogItem,
  ApiGetMaterialCatalog,
  ApiUpdateMaterialCatalogItem,
} from '../docs/material-catalog.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

// Endpoint compartido (profesional armando un presupuesto Y Web admin gestionando el catálogo) —
// mismo contrato que openspec/specs/multi-option-quotes.md, no hay una ruta admin separada de
// listado, solo de escritura (ver AdminMaterialCatalogController).
@ApiTags('material-catalog')
@Controller('material-catalog')
@UseGuards(JwtAuthGuard)
export class MaterialCatalogController {
  constructor(private readonly service: MaterialCatalogService) {}

  @Get()
  @ApiGetMaterialCatalog()
  async list(
    @Query() query: GetMaterialCatalogListQueryDTO,
  ): Promise<MaterialCatalogListResponseDTO> {
    return this.service.list(query);
  }
}

@ApiTags('material-catalog (staff)')
@Controller('admin/material-catalog')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminMaterialCatalogController {
  constructor(private readonly service: MaterialCatalogService) {}

  @Post()
  @Permissions(PERMISSIONS.MATERIAL_CATALOG.MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiCreateMaterialCatalogItem()
  async create(
    @Body() dto: CreateMaterialCatalogItemRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<MaterialCatalogItemResponseDTO> {
    return this.service.create(dto, req.user.referenceId);
  }

  @Patch(':referenceId')
  @Permissions(PERMISSIONS.MATERIAL_CATALOG.MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiUpdateMaterialCatalogItem()
  async update(
    @Param() param: MaterialCatalogItemReferenceParamDTO,
    @Body() dto: UpdateMaterialCatalogItemRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<MaterialCatalogItemResponseDTO> {
    return this.service.update(param.referenceId, dto, req.user.referenceId);
  }
}
