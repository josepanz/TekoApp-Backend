import { ApiProperty } from '@nestjs/swagger';
import { UserConsentResponseDTO } from './user-consent.response.dto';
import { ContentConsentGrantResponseDTO } from './content-consent-grant.response.dto';

export class DataConsentsHistoryResponseDTO {
  @ApiProperty({ type: [UserConsentResponseDTO] })
  consents!: UserConsentResponseDTO[];

  @ApiProperty({ type: [ContentConsentGrantResponseDTO] })
  contentGrants!: ContentConsentGrantResponseDTO[];
}
