import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRatingRequestDTO } from './create-rating.request.dto';

export class UpdateRatingRequestDTO extends PartialType(
  OmitType(CreateRatingRequestDTO, [
    'professionalId',
    'serviceRequestId',
    'type',
  ] as const),
) {}
