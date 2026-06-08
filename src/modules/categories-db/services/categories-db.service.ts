import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@/core/database/services/prisma.service';
import { Category, Prisma, CategoryStatus } from '@prisma/client';

@Injectable()
export class CategoriesDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async findUnique(
    where: Prisma.CategoryWhereUniqueInput,
  ): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where,
      include: {
        professionals: true,
        services: true,
      },
    });
  }

  async findFirst(where: Prisma.CategoryWhereInput): Promise<Category | null> {
    return this.prisma.category.findFirst({ where });
  }

  async findMany(args?: Prisma.CategoryFindManyArgs): Promise<Category[]> {
    return this.prisma.category.findMany(args);
  }

  async update(
    id: number,
    data: Prisma.CategoryUpdateInput,
  ): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Category> {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async countSubcategories(parentCategoryId: number): Promise<number> {
    return this.prisma.category.count({
      where: { parentCategoryId },
    });
  }

  async search(query: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        status: CategoryStatus.ACTIVE,
        isVisible: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }
}
