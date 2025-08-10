import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Professional } from '../professionals/entities/professional.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Professional)
    private readonly professionalRepository: Repository<Professional>,
    private readonly configService: ConfigService,
  ) {}

  async updateLocation(
    professionalId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Professional> {
    const professional = await this.professionalRepository.findOne({
      where: { id: professionalId },
    });

    if (!professional) {
      throw new NotFoundException('Profesional no encontrado');
    }

    professional.updateLocation(
      updateLocationDto.latitude,
      updateLocationDto.longitude,
    );

    return this.professionalRepository.save(professional);
  }

  async findNearbyProfessionals(findNearbyDto: FindNearbyDto): Promise<Professional[]> {
    const { latitude, longitude, radius = 10, categoryId } = findNearbyDto;

    // Radio por defecto desde configuración
    const defaultRadius = this.configService.get<number>('DEFAULT_RADIUS_KM', 10);
    const maxRadius = this.configService.get<number>('MAX_RADIUS_KM', 50);
    
    // Validar radio
    const searchRadius = Math.min(Math.max(radius, 1), maxRadius);

    // Query base para profesionales disponibles
    let query = this.professionalRepository
      .createQueryBuilder('professional')
      .leftJoinAndSelect('professional.user', 'user')
      .leftJoinAndSelect('professional.category', 'category')
      .where('professional.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('professional.isOnline = :isOnline', { isOnline: true })
      .andWhere('professional.status = :status', { status: 'approved' })
      .andWhere('professional.verificationStatus = :verificationStatus', { verificationStatus: 'verified' });

    // Filtrar por categoría si se especifica
    if (categoryId) {
      query = query.andWhere('professional.categoryId = :categoryId', { categoryId });
    }

    // Calcular distancia usando fórmula de Haversine
    query = query
      .addSelect(
        `(
          6371 * acos(
            cos(radians(:latitude)) * 
            cos(radians(professional.currentLatitude)) * 
            cos(radians(professional.currentLongitude) - radians(:longitude)) + 
            sin(radians(:latitude)) * 
            sin(radians(professional.currentLatitude))
          )
        )`,
        'distance',
      )
      .setParameters({ latitude, longitude })
      .andWhere(
        'professional.currentLatitude IS NOT NULL AND professional.currentLongitude IS NOT NULL',
      )
      .having('distance <= :radius', { radius: searchRadius })
      .orderBy('distance', 'ASC')
      .addOrderBy('professional.averageRating', 'DESC')
      .limit(50);

    const professionals = await query.getRawAndEntities();

    // Mapear resultados con distancia
    return professionals.entities.map((professional, index) => {
      const rawData = professionals.raw[index];
      return {
        ...professional,
        distance: parseFloat(rawData.distance),
      };
    });
  }

  async getProfessionalLocation(professionalId: string): Promise<{
    latitude: number;
    longitude: number;
    lastUpdate: Date;
  } | null> {
    const professional = await this.professionalRepository.findOne({
      where: { id: professionalId },
      select: ['currentLatitude', 'currentLongitude', 'lastLocationUpdate'],
    });

    if (!professional || !professional.currentLatitude || !professional.currentLongitude) {
      return null;
    }

    return {
      latitude: professional.currentLatitude,
      longitude: professional.currentLongitude,
      lastUpdate: professional.lastLocationUpdate,
    };
  }

  async getOnlineProfessionalsCount(): Promise<number> {
    return this.professionalRepository.count({
      where: {
        isOnline: true,
        isAvailable: true,
        status: 'approved',
        verificationStatus: 'verified',
      },
    });
  }

  async getProfessionalsByArea(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
  ): Promise<Professional[]> {
    return this.professionalRepository
      .createQueryBuilder('professional')
      .leftJoinAndSelect('professional.user', 'user')
      .leftJoinAndSelect('professional.category', 'category')
      .where('professional.currentLatitude BETWEEN :minLat AND :maxLat', { minLat, maxLat })
      .andWhere('professional.currentLongitude BETWEEN :minLng AND :maxLng', { minLng, maxLng })
      .andWhere('professional.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('professional.isOnline = :isOnline', { isOnline: true })
      .getMany();
  }

  async calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): Promise<number> {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
