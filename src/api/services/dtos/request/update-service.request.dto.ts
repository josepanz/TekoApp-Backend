import { PartialType } from '@nestjs/swagger';
import { CreateServiceRequestDTO } from './create-service.request.dto';

export class UpdateServiceRequestDTO extends PartialType(
  CreateServiceRequestDTO,
) {}
