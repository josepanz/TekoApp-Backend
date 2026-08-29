import { Injectable } from '@nestjs/common';
import { Prisma, ProfessionalDocumentTypes } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class ProfessionalDocumentTypesDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  /** Listado filtrable simple (catálogo, siempre chico — no pagina, mismo criterio que Category). */
  async findFiltered(filters: {
    countryId?: number;
    professionalCategoryId?: number;
    category?: Prisma.EnumDocumentCategoryFilter['equals'];
  }): Promise<ProfessionalDocumentTypes[]> {
    return this.prisma.extended.professionalDocumentTypes.findMany({
      where: {
        isActive: true,
        ...(filters.countryId !== undefined && {
          countryId: filters.countryId,
        }),
        ...(filters.professionalCategoryId !== undefined && {
          professionalCategoryId: filters.professionalCategoryId,
        }),
        ...(filters.category !== undefined && { category: filters.category }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: number): Promise<ProfessionalDocumentTypes | null> {
    return this.prisma.extended.professionalDocumentTypes.findUnique({
      where: { id },
    });
  }

  async findByReferenceId(
    referenceId: string,
  ): Promise<ProfessionalDocumentTypes | null> {
    return this.prisma.extended.professionalDocumentTypes.findUnique({
      where: { referenceId },
    });
  }

  /**
   * Tipos activos que aplican a un profesional según su categoría — `countryId` siempre se
   * filtra a `null` (catálogo internacional) porque `Users`/`Professionals` todavía no tienen un
   * campo de país (misma limitación ya documentada en `legal-consents-db.service.ts`); cuando
   * exista, esto extiende a `OR countryId: professional.countryId` sin romper nada.
   */
  async findApplicableForCategory(
    professionalCategoryId: number,
  ): Promise<ProfessionalDocumentTypes[]> {
    return this.prisma.extended.professionalDocumentTypes.findMany({
      where: {
        isActive: true,
        countryId: null,
        OR: [{ professionalCategoryId: null }, { professionalCategoryId }],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(
    data: Prisma.ProfessionalDocumentTypesUncheckedCreateInput,
  ): Promise<ProfessionalDocumentTypes> {
    return this.prisma.extended.professionalDocumentTypes.create({ data });
  }

  async update(
    id: number,
    data: Prisma.ProfessionalDocumentTypesUncheckedUpdateInput,
  ): Promise<ProfessionalDocumentTypes> {
    return this.prisma.extended.professionalDocumentTypes.update({
      where: { id },
      data,
    });
  }
}
