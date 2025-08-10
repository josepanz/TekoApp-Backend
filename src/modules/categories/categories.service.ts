import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category, CategoryStatus } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verificar si ya existe una categoría con el mismo nombre
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Ya existe una categoría con este nombre');
    }

    // Crear nueva categoría
    const category = this.categoryRepository.create(createCategoryDto);
    
    // Generar slug automáticamente si no se proporciona
    if (!category.slug) {
      category.generateSlug();
    }

    // Verificar categoría padre si se especifica
    if (createCategoryDto.parentCategoryId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentCategoryId },
      });
      
      if (!parentCategory) {
        throw new NotFoundException('Categoría padre no encontrada');
      }
      
      if (parentCategory.parentCategoryId) {
        throw new BadRequestException('No se pueden crear subcategorías de subcategorías');
      }
    }

    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { status: CategoryStatus.ACTIVE, isVisible: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['professionals', 'services'],
    });
  }

  async findAllWithRelations(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['professionals', 'services'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['professionals', 'services'],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug, status: CategoryStatus.ACTIVE, isVisible: true },
      relations: ['professionals', 'services'],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { id: In(ids) },
      relations: ['professionals'],
    });
  }

  async findMainCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { 
        parentCategoryId: null,
        status: CategoryStatus.ACTIVE,
        isVisible: true,
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['professionals'],
    });
  }

  async findSubcategories(parentId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { 
        parentCategoryId: parentId,
        status: CategoryStatus.ACTIVE,
        isVisible: true,
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['professionals'],
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Verificar si se está cambiando el nombre y si ya existe
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Ya existe una categoría con este nombre');
      }
    }

    // Verificar categoría padre si se está cambiando
    if (updateCategoryDto.parentCategoryId && updateCategoryDto.parentCategoryId !== category.parentCategoryId) {
      if (updateCategoryDto.parentCategoryId === id) {
        throw new BadRequestException('Una categoría no puede ser padre de sí misma');
      }

      const parentCategory = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentCategoryId },
      });
      
      if (!parentCategory) {
        throw new NotFoundException('Categoría padre no encontrada');
      }
      
      if (parentCategory.parentCategoryId) {
        throw new BadRequestException('No se pueden crear subcategorías de subcategorías');
      }
    }

    // Generar nuevo slug si se cambió el nombre
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      category.name = updateCategoryDto.name;
      category.generateSlug();
    }

    // Actualizar otros campos
    Object.assign(category, updateCategoryDto);

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Verificar si tiene profesionales o servicios asociados
    if (category.professionals && category.professionals.length > 0) {
      throw new BadRequestException('No se puede eliminar una categoría que tiene profesionales asociados');
    }

    if (category.services && category.services.length > 0) {
      throw new BadRequestException('No se puede eliminar una categoría que tiene servicios asociados');
    }

    // Verificar si tiene subcategorías
    const subcategories = await this.findSubcategories(id);
    if (subcategories.length > 0) {
      throw new BadRequestException('No se puede eliminar una categoría que tiene subcategorías');
    }

    await this.categoryRepository.remove(category);
  }

  async changeStatus(id: string, status: CategoryStatus): Promise<Category> {
    const category = await this.findOne(id);
    category.status = status;
    return this.categoryRepository.save(category);
  }

  async toggleVisibility(id: string): Promise<Category> {
    const category = await this.findOne(id);
    category.isVisible = !category.isVisible;
    return this.categoryRepository.save(category);
  }

  async getCategoryStats(id: string): Promise<{
    professionalCount: number;
    serviceCount: number;
    averageRating: number;
    totalServices: number;
  }> {
    const category = await this.findOne(id);
    
    const professionalCount = category.professionals?.length || 0;
    const serviceCount = category.services?.length || 0;
    
    // Calcular rating promedio de los profesionales
    let totalRating = 0;
    let ratedProfessionals = 0;
    
    if (category.professionals) {
      category.professionals.forEach(professional => {
        if (professional.averageRating > 0) {
          totalRating += professional.averageRating;
          ratedProfessionals++;
        }
      });
    }
    
    const averageRating = ratedProfessionals > 0 ? totalRating / ratedProfessionals : 0;

    return {
      professionalCount,
      serviceCount,
      averageRating: Math.round(averageRating * 100) / 100,
      totalServices: serviceCount,
    };
  }

  async searchCategories(query: string): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .where('category.name ILIKE :query', { query: `%${query}%` })
      .orWhere('category.description ILIKE :query', { query: `%${query}%` })
      .andWhere('category.status = :status', { status: CategoryStatus.ACTIVE })
      .andWhere('category.isVisible = :isVisible', { isVisible: true })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();
  }
}
