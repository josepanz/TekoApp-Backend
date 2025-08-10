import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ApplyPromotionDto {
  @IsString()
  promotionCode: string;

  @IsString()
  serviceId: string;

  @IsNumber()
  @Min(0)
  serviceAmount: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userType?: string;
}
