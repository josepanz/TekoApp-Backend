import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesDbService } from '@modules/categories-db/services/categories-db.service';
import { CreateCategoryDto } from '../dtos/request/create-category.dto';
import { UpdateCategoryDto } from '../dtos/request/update-category.dto';
import { CategoryStatsResponseDTO } from '../dtos/response';
import { Category, CategoryStatus, Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesDb: CategoriesDbService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoriesDb.findUnique({ name: dto.name });
    if (existing) {
      throw new ConflictException('Ya existe una categoría con este nombre');
    }

    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);

    if (dto.parentCategoryId) {
      const parent = await this.categoriesDb.findUnique({
        id: dto.parentCategoryId,
      });
      if (!parent) {
        throw new NotFoundException('Categoría padre no encontrada');
      }
      if (parent.parentCategoryId) {
        throw new BadRequestException(
          'No se pueden crear subcategorías de tercer nivel',
        );
      }
    }

    return this.categoriesDb.create({
      name: dto.name,
      slug,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      sortOrder: dto.sortOrder,
      status: dto.status,
      isVisible: dto.isVisible,
      requiresVerification: dto.requiresVerification,
      metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
      parentCategory: dto.parentCategoryId
        ? { connect: { id: dto.parentCategoryId } }
        : undefined,
    });
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesDb.findMany({
      where: { status: CategoryStatus.ACTIVE, isVisible: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllWithRelations(): Promise<Category[]> {
    return this.categoriesDb.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesDb.findUnique({ id });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesDb.findFirst({
      slug,
      status: CategoryStatus.ACTIVE,
      isVisible: true,
    });
    if (!category) {
      throw new NotFoundException(
        'Categoría no encontrada por el slug provisto',
      );
    }
    return category;
  }

  async findMainCategories(): Promise<Category[]> {
    return this.categoriesDb.findMany({
      where: {
        parentCategoryId: null,
        status: CategoryStatus.ACTIVE,
        isVisible: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findSubcategories(parentId: number): Promise<Category[]> {
    return this.categoriesDb.findMany({
      where: {
        parentCategoryId: parentId,
        status: CategoryStatus.ACTIVE,
        isVisible: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async searchCategories(query: string): Promise<Category[]> {
    if (!query) return [];
    return this.categoriesDb.search(query);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesDb.findUnique({ name: dto.name });
      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe otra categoría con este nombre');
      }
    }

    if (
      dto.parentCategoryId &&
      dto.parentCategoryId !== category.parentCategoryId
    ) {
      if (dto.parentCategoryId === id) {
        throw new BadRequestException(
          'Una categoría no puede ser padre de sí misma',
        );
      }
      const parent = await this.categoriesDb.findUnique({
        id: dto.parentCategoryId,
      });
      if (!parent) {
        throw new NotFoundException('Categoría padre no encontrada');
      }
      if (parent.parentCategoryId) {
        throw new BadRequestException(
          'No se pueden anidar subcategorías en múltiples subniveles',
        );
      }
    }

    const updateData: Prisma.CategoryUpdateInput = {
      ...dto,
      slug: dto.name ? this.slugify(dto.name) : undefined,
      metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
    };

    return this.categoriesDb.update(id, updateData);
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoriesDb.findUnique({ id });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Casteo seguro de relaciones cargadas desde el db service
    const relations = category as unknown as {
      professionals: unknown[];
      services: unknown[];
    };

    if (relations.professionals?.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar una categoría que contiene profesionales activos asociados',
      );
    }

    if (relations.services?.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar una categoría que tiene servicios vinculados',
      );
    }

    const subCount = await this.categoriesDb.countSubcategories(id);
    if (subCount > 0) {
      throw new BadRequestException(
        'No es posible remover una categoría que posee subcategorías hijas',
      );
    }

    await this.categoriesDb.delete(id);
  }

  async changeStatus(id: number, status: CategoryStatus): Promise<Category> {
    await this.findOne(id);
    return this.categoriesDb.update(id, { status });
  }

  async toggleVisibility(id: number): Promise<Category> {
    const category = await this.findOne(id);
    return this.categoriesDb.update(id, { isVisible: !category.isVisible });
  }

  async getCategoryStats(id: number): Promise<CategoryStatsResponseDTO> {
    const category = await this.findOne(id);
    const relations = category as unknown as {
      professionals: { averageRating: number }[];
      services: unknown[];
    };

    const professionalCount = relations.professionals?.length || 0;
    const serviceCount = relations.services?.length || 0;

    let totalRating = 0;
    let ratedProfessionals = 0;

    if (relations.professionals) {
      relations.professionals.forEach((p) => {
        if (p.averageRating > 0) {
          totalRating += p.averageRating;
          ratedProfessionals++;
        }
      });
    }

    const averageRating =
      ratedProfessionals > 0 ? totalRating / ratedProfessionals : 0;

    return {
      professionalCount,
      serviceCount,
      averageRating: Math.round(averageRating * 100) / 100,
      totalServices: serviceCount,
    };
  }
}
