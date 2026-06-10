import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UploadFileParamDTO {
  @ApiProperty({ description: 'Nombre del archivo', example: 'abc123.jpg' })
  @IsString()
  @IsNotEmpty()
  filename!: string;
}
