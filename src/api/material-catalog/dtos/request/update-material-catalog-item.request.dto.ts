import { PartialType } from '@nestjs/swagger';
import { CreateMaterialCatalogItemRequestDTO } from './create-material-catalog-item.request.dto';

export class UpdateMaterialCatalogItemRequestDTO extends PartialType(
  CreateMaterialCatalogItemRequestDTO,
) {}
