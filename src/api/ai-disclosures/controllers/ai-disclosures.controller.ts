import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { AiDisclosuresService } from '../services/ai-disclosures.service';
import {
  AiDisclosureEntityParamDTO,
  DeclareAiDisclosureRequestDTO,
} from '../dtos/request';
import { AiDisclosureResponseDTO } from '../dtos/response';
import {
  ApiDeclareAiDisclosure,
  ApiGetAiDisclosure,
  ApiRetractAiDisclosure,
} from '../docs/ai-disclosures.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('Disclosure de IA')
@Controller('ai-disclosures')
@UseGuards(JwtAuthGuard)
export class AiDisclosuresController {
  constructor(private readonly aiDisclosuresService: AiDisclosuresService) {}

  @Put()
  @ApiDeclareAiDisclosure()
  async declare(
    @Body() dto: DeclareAiDisclosureRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<AiDisclosureResponseDTO> {
    return this.aiDisclosuresService.declare(
      req.user.id,
      dto,
      req.user.referenceId,
    );
  }

  @Delete(':entityType/:entityReferenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRetractAiDisclosure()
  async retract(
    @Param() param: AiDisclosureEntityParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.aiDisclosuresService.retract(req.user.id, param);
  }

  @Get(':entityType/:entityReferenceId')
  @ApiGetAiDisclosure()
  async getByEntity(
    @Param() param: AiDisclosureEntityParamDTO,
  ): Promise<AiDisclosureResponseDTO | null> {
    return this.aiDisclosuresService.findByEntity(param);
  }
}
