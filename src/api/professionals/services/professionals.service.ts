import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { PaginationQueryDTO } from '@common/dtos/pagination.dto';
import {
  GetProfessionalsListQueryDTO,
  GetNearbyProfessionalsQueryDTO,
  GetTopRatedQueryDTO,
  SearchBySkillsQueryDTO,
  GetProfessionalServicesQueryDTO,
  GetProfessionalReviewsQueryDTO,
  CreateProfessionalRequestDTO,
  UpdateProfessionalRequestDTO,
  UpdateProfessionalLocationRequestDTO,
  VerifyProfessionalRequestDTO,
} from '../dtos/request';
import {
  ProfessionalDetailResponseDTO,
  ProfessionalsListResponseDTO,
  ProfessionalServicesListResponseDTO,
  ProfessionalReviewsListResponseDTO,
  ProfessionalStatsResponseDTO,
} from '../dtos/response';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly professionalsDb: ProfessionalsDbService) {}

  async registerProfessional(
    dto: CreateProfessionalRequestDTO,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const result = await this.professionalsDb.create(
      dto as unknown as Prisma.ProfessionalsUncheckedCreateInput,
      userId,
    );
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async getProfessionals(
    query: GetProfessionalsListQueryDTO,
  ): Promise<ProfessionalsListResponseDTO> {
    const filters = {
      categoryId: query.categoryId,
      latitude: query.latitude,
      longitude: query.longitude,
      radius: query.radius,
      minRating: query.minRating,
      maxPrice: query.maxPrice,
      isAvailable: query.isAvailable,
    };
    const result = await this.professionalsDb.findMany(
      filters,
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
    );
    return result as unknown as ProfessionalsListResponseDTO;
  }

  async getNearbyProfessionals(
    query: GetNearbyProfessionalsQueryDTO,
  ): Promise<ProfessionalDetailResponseDTO[]> {
    const result = await this.professionalsDb.findNearby(
      query.latitude,
      query.longitude,
      query.radius,
      query.categoryId,
    );
    return result as unknown as ProfessionalDetailResponseDTO[];
  }

  async getProfessionalById(
    id: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const result = await this.professionalsDb.findById(id);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async updateProfessional(
    id: number,
    dto: UpdateProfessionalRequestDTO,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }
    const result = await this.professionalsDb.update(id, dto);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async updateAvailability(
    id: number,
    isAvailable: boolean,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }
    const result = await this.professionalsDb.update(id, { isAvailable });
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async updateLocation(
    id: number,
    dto: UpdateProfessionalLocationRequestDTO,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }
    const result = await this.professionalsDb.update(id, {
      currentLatitude: dto.latitude,
      currentLongitude: dto.longitude,
      lastLocationUpdate: new Date(),
    });
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async getProfessionalServices(
    id: number,
    query: GetProfessionalServicesQueryDTO,
  ): Promise<ProfessionalServicesListResponseDTO> {
    const result = await this.professionalsDb.findServices(
      id,
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
      query.status,
    );
    return result as unknown as ProfessionalServicesListResponseDTO;
  }

  async getProfessionalReviews(
    id: number,
    query: GetProfessionalReviewsQueryDTO,
  ): Promise<ProfessionalReviewsListResponseDTO> {
    const result = await this.professionalsDb.findReviews(
      id,
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
    );
    return result as unknown as ProfessionalReviewsListResponseDTO;
  }

  async getProfessionalStats(
    id: number,
  ): Promise<ProfessionalStatsResponseDTO> {
    return this.professionalsDb.getStats(id);
  }

  async searchBySkills(
    query: SearchBySkillsQueryDTO,
  ): Promise<ProfessionalsListResponseDTO> {
    const skills = query.skills.split(',').map((s) => s.trim());
    const result = await this.professionalsDb.searchBySkills(
      skills,
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
    );
    return result as unknown as ProfessionalsListResponseDTO;
  }

  async getTopRatedProfessionals(
    query: GetTopRatedQueryDTO,
  ): Promise<ProfessionalDetailResponseDTO[]> {
    const result = await this.professionalsDb.getTopRated(
      query.categoryId,
      query.limit,
    );
    return result as unknown as ProfessionalDetailResponseDTO[];
  }

  async verifyProfessional(
    id: number,
    dto: VerifyProfessionalRequestDTO,
    adminId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    await this.professionalsDb.findById(id);
    const result = await this.professionalsDb.update(id, {
      verificationStatus: dto.isVerified ? 'verified' : 'rejected',
      status: dto.isVerified ? 'APPROVED' : 'REJECTED',
      lastChangedBy: String(adminId),
      changedReason: dto.notes,
    });
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async suspendProfessional(
    id: number,
    reason: string,
    adminId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    await this.professionalsDb.findById(id);
    const result = await this.professionalsDb.update(id, {
      status: 'SUSPENDED',
      isActive: false,
      lastChangedBy: String(adminId),
      changedReason: reason,
    });
    return result as unknown as ProfessionalDetailResponseDTO;
  }
}
