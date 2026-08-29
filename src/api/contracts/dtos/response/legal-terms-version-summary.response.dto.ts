import { ApiProperty } from '@nestjs/swagger';

export class LegalTermsVersionSummaryDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  contentUrl!: string;
}
