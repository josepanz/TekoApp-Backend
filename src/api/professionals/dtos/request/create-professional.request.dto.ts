import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProfessionalRequestDTO {
  @ApiProperty({ description: 'ID de la categoría principal', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiProperty({
    description: 'Descripción del perfil profesional',
    example: 'Electricista con 10 años de experiencia',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Tarifa por hora', example: 50.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate!: number;

  @ApiPropertyOptional({
    description: 'Tarifa fija por servicio',
    example: 200.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedRate?: number;

  @ApiPropertyOptional({
    description: 'Habilidades del profesional',
    example: ['electricidad', 'iluminación'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Certificaciones',
    example: ['IRAM 2020'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Años de experiencia', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;
}
