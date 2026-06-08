import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Professional } from './entities/professional.entity';
import { ProfessionalCategory } from './entities/professional-category.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../api/categories/entities/category.entity';
import { Service } from '../services/entities/service.entity';
import { Rating } from '../ratings/entities/rating.entity';

export interface ProfessionalFilters {
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

export interface ProfessionalStats {
  totalServices: number;
  completedServices: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  responseTime: number;
}

@Injectable()
export class ProfessionalsService {
  constructor(
    @InjectRepository(Professional)
    private readonly professionalRepository: Repository<Professional>,
    @InjectRepository(ProfessionalCategory)
    private readonly professionalCategoryRepository: Repository<ProfessionalCategory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async registerProfessional(
    registerDto: any,
    userId: string,
  ): Promise<Professional> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que no es ya un profesional
    const existingProfessional = await this.professionalRepository.findOne({
      where: { id: userId },
    });
    if (existingProfessional) {
      throw new BadRequestException('El usuario ya es un profesional');
    }

    // Verificar que las categorías existen
    if (registerDto.categoryIds && registerDto.categoryIds.length > 0) {
      const categories = await this.categoryRepository.find({
        where: { id: In(registerDto.categoryIds) },
      });
      if (categories.length !== registerDto.categoryIds.length) {
        throw new BadRequestException('Una o más categorías no existen');
      }
    }

    const professional = this.professionalRepository.create({
      id: userId,
      ...registerDto,
      isVerified: false,
      isAvailable: true,
      isActive: true,
    });

    const savedProfessional =
      await this.professionalRepository.save(professional);

    // Crear relaciones con categorías
    if (registerDto.categoryIds && registerDto.categoryIds.length > 0) {
      const professionalCategories = registerDto.categoryIds.map(
        (categoryId) => ({
          professionalId: userId,
          categoryId,
        }),
      );
      await this.professionalCategoryRepository.save(professionalCategories);
    }

    return savedProfessional;
  }

  async getProfessionals(
    filters: ProfessionalFilters,
  ): Promise<{ professionals: Professional[]; total: number }> {
    const queryBuilder = this.professionalRepository
      .createQueryBuilder('professional')
      .leftJoinAndSelect('professional.user', 'user')
      .leftJoinAndSelect('professional.categories', 'categories')
      .leftJoinAndSelect('categories.category', 'category');

    // Aplicar filtros
    if (filters.categoryId) {
      queryBuilder.andWhere('categories.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.latitude && filters.longitude && filters.radius) {
      // Filtro por distancia
      const latRange = filters.radius / 111;
      const lngRange =
        filters.radius / (111 * Math.cos((filters.latitude * Math.PI) / 180));

      queryBuilder.andWhere(
        'professional.latitude BETWEEN :minLat AND :maxLat',
        {
          minLat: filters.latitude - latRange,
          maxLat: filters.latitude + latRange,
        },
      );
      queryBuilder.andWhere(
        'professional.longitude BETWEEN :minLng AND :maxLng',
        {
          minLng: filters.longitude - lngRange,
          maxLng: filters.longitude + lngRange,
        },
      );
    }

    if (filters.minRating) {
      queryBuilder.andWhere('professional.averageRating >= :minRating', {
        minRating: filters.minRating,
      });
    }

    if (filters.maxPrice) {
      queryBuilder.andWhere('professional.hourlyRate <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.isAvailable !== undefined) {
      queryBuilder.andWhere('professional.isAvailable = :isAvailable', {
        isAvailable: filters.isAvailable,
      });
    }

    // Solo profesionales activos y verificados
    queryBuilder.andWhere('professional.isActive = :isActive', {
      isActive: true,
    });

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    queryBuilder
      .orderBy('professional.averageRating', 'DESC')
      .addOrderBy('professional.responseTime', 'ASC')
      .skip(offset)
      .take(limit);

    const [professionals, total] = await queryBuilder.getManyAndCount();

    return { professionals, total };
  }

  async getNearbyProfessionals(
    latitude: number,
    longitude: number,
    radius: number = 10,
    categoryId?: string,
  ): Promise<Professional[]> {
    const queryBuilder = this.professionalRepository
      .createQueryBuilder('professional')
      .leftJoinAndSelect('professional.user', 'user')
      .leftJoinAndSelect('professional.categories', 'categories')
      .leftJoinAndSelect('categories.category', 'category')
      .where('professional.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('professional.isActive = :isActive', { isActive: true });

    if (categoryId) {
      queryBuilder.andWhere('categories.categoryId = :categoryId', {
        categoryId,
      });
    }

    // Filtro por distancia
    const latRange = radius / 111;
    const lngRange = radius / (111 * Math.cos((latitude * Math.PI) / 180));

    queryBuilder
      .andWhere('professional.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latRange,
        maxLat: latitude + latRange,
      })
      .andWhere('professional.longitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngRange,
        maxLng: longitude + lngRange,
      })
      .orderBy('professional.averageRating', 'DESC')
      .addOrderBy('professional.responseTime', 'ASC')
      .take(50);

    return queryBuilder.getMany();
  }

  async getProfessionalById(id: string): Promise<Professional> {
    const professional = await this.professionalRepository.findOne({
      where: { id },
      relations: ['user', 'categories', 'categories.category'],
    });

    if (!professional) {
      throw new NotFoundException('Profesional no encontrado');
    }

    return professional;
  }

  async updateProfessional(
    id: string,
    updateDto: any,
    userId: string,
  ): Promise<Professional> {
    const professional = await this.getProfessionalById(id);

    // Verificar permisos
    if (professional.id !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }

    Object.assign(professional, updateDto);
    return this.professionalRepository.save(professional);
  }

  async updateAvailability(
    id: string,
    availabilityDto: any,
    userId: string,
  ): Promise<Professional> {
    const professional = await this.getProfessionalById(id);

    if (professional.id !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }

    professional.isAvailable = availabilityDto.isAvailable;
    if (availabilityDto.availableHours) {
      professional.availableHours = availabilityDto.availableHours;
    }

    return this.professionalRepository.save(professional);
  }

  async updateLocation(
    id: string,
    locationDto: any,
    userId: string,
  ): Promise<Professional> {
    const professional = await this.getProfessionalById(id);

    if (professional.id !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }

    professional.latitude = locationDto.latitude;
    professional.longitude = locationDto.longitude;
    professional.address = locationDto.address;
    professional.lastLocationUpdate = new Date();

    return this.professionalRepository.save(professional);
  }

  async addCategories(
    id: string,
    categoryIds: string[],
    userId: string,
  ): Promise<Professional> {
    const professional = await this.getProfessionalById(id);

    if (professional.id !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }

    // Verificar que las categorías existen
    const categories = await this.categoryRepository.find({
      where: { id: In(categoryIds) },
    });
    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('Una o más categorías no existen');
    }

    // Crear nuevas relaciones
    const professionalCategories = categoryIds.map((categoryId) => ({
      professionalId: id,
      categoryId,
    }));

    await this.professionalCategoryRepository.save(professionalCategories);

    return this.getProfessionalById(id);
  }

  async removeCategory(
    id: string,
    categoryId: string,
    userId: string,
  ): Promise<Professional> {
    const professional = await this.getProfessionalById(id);

    if (professional.id !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }

    await this.professionalCategoryRepository.delete({
      professionalId: id,
      categoryId,
    });

    return this.getProfessionalById(id);
  }

  async getProfessionalServices(
    id: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ services: Service[]; total: number }> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.professionalId = :professionalId', {
        professionalId: id,
      });

    if (status) {
      queryBuilder.andWhere('service.status = :status', { status });
    }

    const offset = (page - 1) * limit;
    queryBuilder.orderBy('service.createdAt', 'DESC').skip(offset).take(limit);

    const [services, total] = await queryBuilder.getManyAndCount();

    return { services, total };
  }

  async getProfessionalReviews(
    id: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ reviews: Rating[]; total: number }> {
    const queryBuilder = this.ratingRepository
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.client', 'client')
      .leftJoinAndSelect('rating.service', 'service')
      .where('rating.professionalId = :professionalId', { professionalId: id })
      .andWhere('rating.rating IS NOT NULL');

    const offset = (page - 1) * limit;
    queryBuilder.orderBy('rating.createdAt', 'DESC').skip(offset).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return { reviews, total };
  }

  async getProfessionalStats(id: string): Promise<ProfessionalStats> {
    const professional = await this.getProfessionalById(id);

    const [totalServices, completedServices] = await Promise.all([
      this.serviceRepository.count({
        where: { professionalId: id },
      }),
      this.serviceRepository.count({
        where: { professionalId: id, status: 'completed' },
      }),
    ]);

    // Calcular ganancias totales
    const earningsResult = await this.serviceRepository
      .createQueryBuilder('service')
      .select('SUM(service.finalAmount)', 'total')
      .where('service.professionalId = :professionalId', { professionalId: id })
      .andWhere('service.status = :status', { status: 'completed' })
      .getRawOne();

    const totalEarnings = parseFloat(earningsResult?.total || '0');

    // Calcular calificación promedio
    const ratingResult = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'average')
      .where('rating.professionalId = :professionalId', { professionalId: id })
      .andWhere('rating.rating IS NOT NULL')
      .getRawOne();

    const averageRating = parseFloat(ratingResult?.average || '0');

    // Contar reseñas
    const totalReviews = await this.ratingRepository.count({
      where: { professionalId: id, rating: Not(null) },
    });

    return {
      totalServices,
      completedServices,
      totalEarnings,
      averageRating,
      totalReviews,
      responseTime: professional.responseTime || 0,
    };
  }

  async verifyProfessional(
    id: string,
    verificationDto: any,
    adminId: string,
  ): Promise<Professional> {
    // Aquí deberías verificar que el usuario es admin
    const professional = await this.getProfessionalById(id);

    professional.isVerified = verificationDto.isVerified;
    professional.verifiedAt = new Date();
    professional.verifiedBy = adminId;
    professional.verificationNotes = verificationDto.notes;

    return this.professionalRepository.save(professional);
  }

  async suspendProfessional(
    id: string,
    suspensionDto: any,
    adminId: string,
  ): Promise<Professional> {
    // Aquí deberías verificar que el usuario es admin
    const professional = await this.getProfessionalById(id);

    professional.isActive = false;
    professional.suspendedAt = new Date();
    professional.suspendedBy = adminId;
    professional.suspensionReason = suspensionDto.reason;
    professional.suspensionEndDate = suspensionDto.endDate;

    return this.professionalRepository.save(professional);
  }

  async searchBySkills(
    skills: string[],
    page: number = 1,
    limit: number = 10,
  ): Promise<{ professionals: Professional[]; total: number }> {
    const queryBuilder = this.professionalRepository
      .createQueryBuilder('professional')
      .leftJoinAndSelect('professional.user', 'user')
      .leftJoinAndSelect('professional.categories', 'categories')
      .leftJoinAndSelect('categories.category', 'category')
      .where('professional.isActive = :isActive', { isActive: true });

    // Buscar por habilidades (en descripción o categorías)
    const skillConditions = skills
      .map(
        (skill) =>
          `(professional.description ILIKE :${skill} OR professional.skills ILIKE :${skill})`,
      )
      .join(' OR ');

    if (skillConditions) {
      queryBuilder.andWhere(`(${skillConditions})`);
      skills.forEach((skill) => {
        queryBuilder.setParameter(skill, `%${skill}%`);
      });
    }

    const offset = (page - 1) * limit;
    queryBuilder
      .orderBy('professional.averageRating', 'DESC')
      .skip(offset)
      .take(limit);

    const [professionals, total] = await queryBuilder.getManyAndCount();

    return { professionals, total };
  }

  async getTopRatedProfessionals(
    categoryId?: string,
    limit: number = 10,
  ): Promise<Professional[]> {
    const queryBuilder = this.professionalRepository
      .createQueryBuilder('professional')
      .leftJoinAndSelect('professional.user', 'user')
      .leftJoinAndSelect('professional.categories', 'categories')
      .leftJoinAndSelect('categories.category', 'category')
      .where('professional.isActive = :isActive', { isActive: true })
      .andWhere('professional.isVerified = :isVerified', { isVerified: true })
      .andWhere('professional.averageRating > 0');

    if (categoryId) {
      queryBuilder.andWhere('categories.categoryId = :categoryId', {
        categoryId,
      });
    }

    return queryBuilder
      .orderBy('professional.averageRating', 'DESC')
      .addOrderBy('professional.totalServices', 'DESC')
      .take(limit)
      .getMany();
  }
}
