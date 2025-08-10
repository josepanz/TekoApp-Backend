import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Rating, RatingType } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async create(userId: string, createRatingDto: CreateRatingDto): Promise<Rating> {
    // Verificar si ya existe una calificación para este usuario, profesional y servicio
    const existingRating = await this.ratingRepository.findOne({
      where: {
        userId,
        professionalId: createRatingDto.professionalId,
        serviceRequestId: createRatingDto.serviceRequestId,
        type: createRatingDto.type,
      },
    });

    if (existingRating) {
      throw new BadRequestException('Ya has calificado este servicio');
    }

    // Crear nueva calificación
    const rating = this.ratingRepository.create({
      ...createRatingDto,
      userId,
    });

    return this.ratingRepository.save(rating);
  }

  async findAll(): Promise<Rating[]> {
    return this.ratingRepository.find({
      relations: ['user', 'professional', 'serviceRequest'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOne({
      where: { id },
      relations: ['user', 'professional', 'serviceRequest'],
    });

    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    return rating;
  }

  async findByUser(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { userId },
      relations: ['professional', 'serviceRequest'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProfessional(professionalId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { professionalId },
      relations: ['user', 'serviceRequest'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByServiceRequest(serviceRequestId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { serviceRequestId },
      relations: ['user', 'professional'],
      order: { createdAt: 'DESC' },
    });
  }

  async findClientRatings(professionalId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: {
        professionalId,
        type: RatingType.CLIENT_TO_PROFESSIONAL,
        isAnonymous: false,
      },
      relations: ['user', 'serviceRequest'],
      order: { createdAt: 'DESC' },
    });
  }

  async findProfessionalRatings(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: {
        userId,
        type: RatingType.PROFESSIONAL_TO_CLIENT,
        isAnonymous: false,
      },
      relations: ['professional', 'serviceRequest'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, userId: string, updateRatingDto: UpdateRatingDto): Promise<Rating> {
    const rating = await this.findOne(id);

    // Verificar que el usuario sea el propietario de la calificación
    if (rating.userId !== userId) {
      throw new ForbiddenException('No puedes editar esta calificación');
    }

    // Verificar si se puede editar (dentro de las 24 horas)
    if (!rating.canBeEdited()) {
      throw new BadRequestException('No se puede editar la calificación después de 24 horas');
    }

    // Actualizar calificación
    Object.assign(rating, updateRatingDto);
    return this.ratingRepository.save(rating);
  }

  async remove(id: string, userId: string): Promise<void> {
    const rating = await this.findOne(id);

    // Verificar que el usuario sea el propietario de la calificación
    if (rating.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar esta calificación');
    }

    // Verificar si se puede eliminar
    if (!rating.canBeDeleted()) {
      throw new BadRequestException('No se puede eliminar esta calificación');
    }

    await this.ratingRepository.remove(rating);
  }

  async reportRating(id: string, userId: string, reason: string): Promise<Rating> {
    const rating = await this.findOne(id);

    // No se puede reportar tu propia calificación
    if (rating.userId === userId) {
      throw new BadRequestException('No puedes reportar tu propia calificación');
    }

    rating.isReported = true;
    rating.reportReason = reason;

    return this.ratingRepository.save(rating);
  }

  async getAverageRating(professionalId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: Record<number, number>;
    averageCriteria: Record<string, number>;
  }> {
    const ratings = await this.ratingRepository.find({
      where: {
        professionalId,
        type: RatingType.CLIENT_TO_PROFESSIONAL,
      },
    });

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageCriteria: {},
      };
    }

    // Calcular rating promedio
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    // Calcular distribución de ratings
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
      ratingDistribution[rating.rating]++;
    });

    // Calcular criterios promedio
    const criteriaTotals: Record<string, number> = {};
    const criteriaCounts: Record<string, number> = {};

    ratings.forEach(rating => {
      if (rating.criteria) {
        Object.entries(rating.criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            criteriaTotals[key] = (criteriaTotals[key] || 0) + value;
            criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
          }
        });
      }
    });

    const averageCriteria: Record<string, number> = {};
    Object.keys(criteriaTotals).forEach(key => {
      averageCriteria[key] = criteriaTotals[key] / criteriaCounts[key];
    });

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings: ratings.length,
      ratingDistribution,
      averageCriteria,
    };
  }

  async getUserRatingStats(userId: string): Promise<{
    givenRatings: number;
    receivedRatings: number;
    averageGivenRating: number;
    averageReceivedRating: number;
  }> {
    const givenRatings = await this.ratingRepository.find({
      where: { userId },
    });

    const receivedRatings = await this.ratingRepository.find({
      where: { userId },
      relations: ['professional'],
    });

    const averageGivenRating = givenRatings.length > 0
      ? givenRatings.reduce((sum, rating) => sum + rating.rating, 0) / givenRatings.length
      : 0;

    const averageReceivedRating = receivedRatings.length > 0
      ? receivedRatings.reduce((sum, rating) => sum + rating.rating, 0) / receivedRatings.length
      : 0;

    return {
      givenRatings: givenRatings.length,
      receivedRatings: receivedRatings.length,
      averageGivenRating: Math.round(averageGivenRating * 100) / 100,
      averageReceivedRating: Math.round(averageReceivedRating * 100) / 100,
    };
  }

  async getTopRatedProfessionals(limit: number = 10): Promise<Array<{
    professionalId: string;
    averageRating: number;
    totalRatings: number;
  }>> {
    const result = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('rating.professionalId', 'professionalId')
      .addSelect('AVG(rating.rating)', 'averageRating')
      .addSelect('COUNT(rating.id)', 'totalRatings')
      .where('rating.type = :type', { type: RatingType.CLIENT_TO_PROFESSIONAL })
      .groupBy('rating.professionalId')
      .having('COUNT(rating.id) >= :minRatings', { minRatings: 3 })
      .orderBy('AVG(rating.rating)', 'DESC')
      .addOrderBy('COUNT(rating.id)', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(item => ({
      professionalId: item.professionalId,
      averageRating: Math.round(parseFloat(item.averageRating) * 100) / 100,
      totalRatings: parseInt(item.totalRatings),
    }));
  }

  async getRecentRatings(limit: number = 20): Promise<Rating[]> {
    return this.ratingRepository.find({
      relations: ['user', 'professional', 'serviceRequest'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
