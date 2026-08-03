import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';

export class CreateFcmTokenRequestDTO {
  @ApiProperty({
    description:
      'Token FCM del dispositivo (retornado por firebase_messaging/getToken())',
    example: 'dGVzdC1mY20tdG9rZW4tZXhhbXBsZQ',
  })
  @IsString()
  @IsNotEmpty()
  readonly token!: string;

  @ApiProperty({
    description: 'Plataforma que registra el token',
    enum: DeviceType,
    example: DeviceType.ANDROID,
  })
  @IsEnum(DeviceType)
  readonly deviceType!: DeviceType;
}
