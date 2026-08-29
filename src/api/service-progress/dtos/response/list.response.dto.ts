import { ApiProperty } from '@nestjs/swagger';
import { ServiceProgressEntryResponseDTO } from './entry.response.dto';

export class ServiceProgressListResponseDTO {
  @ApiProperty({ type: [ServiceProgressEntryResponseDTO] })
  data!: ServiceProgressEntryResponseDTO[];
}
