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

import { t } from '@common/i18n/i18n.helper';
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
      throw new ConflictException(t('categories.NAME_ALREADY_EXISTS'));
    }

    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);

    if (dto.parentCategoryId) {
      const parent = await this.categoriesDb.findUnique({
        id: dto.parentCategoryId,
      });
      if (!parent) {
        throw new NotFoundException(t('categories.PARENT_NOT_FOUND'));
      }
      if (parent.parentCategoryId) {
        throw new BadRequestException(t('categories.THIRD_LEVEL_NOT_ALLOWED'));
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
      maxBudgetOptionsPerRequest: dto.maxBudgetOptionsPerRequest,
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
      throw new NotFoundException(t('categories.NOT_FOUND'));
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
      throw new NotFoundException(t('categories.NOT_FOUND_BY_SLUG'));
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
        throw new ConflictException(t('categories.NAME_ALREADY_TAKEN'));
      }
    }

    if (
      dto.parentCategoryId &&
      dto.parentCategoryId !== category.parentCategoryId
    ) {
      if (dto.parentCategoryId === id) {
        throw new BadRequestException(t('categories.CANNOT_BE_ITS_OWN_PARENT'));
      }
      const parent = await this.categoriesDb.findUnique({
        id: dto.parentCategoryId,
      });
      if (!parent) {
        throw new NotFoundException(t('categories.PARENT_NOT_FOUND'));
      }
      if (parent.parentCategoryId) {
        throw new BadRequestException(
          t('categories.CANNOT_NEST_MULTIPLE_SUBLEVELS'),
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
      throw new NotFoundException(t('categories.NOT_FOUND'));
    }

    // Casteo seguro de relaciones cargadas desde el db service
    const relations = category as unknown as {
      professionals: unknown[];
      services: unknown[];
    };

    if (relations.professionals?.length > 0) {
      throw new BadRequestException(
        t('categories.CANNOT_DELETE_WITH_ACTIVE_PROFESSIONALS'),
      );
    }

    if (relations.services?.length > 0) {
      throw new BadRequestException(
        t('categories.CANNOT_DELETE_WITH_LINKED_SERVICES'),
      );
    }

    const subCount = await this.categoriesDb.countSubcategories(id);
    if (subCount > 0) {
      throw new BadRequestException(
        t('categories.CANNOT_DELETE_WITH_CHILDREN'),
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
