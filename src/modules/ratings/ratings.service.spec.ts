import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatingsService } from './ratings.service';
import { Rating, RatingType } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('RatingsService', () => {
  let service: RatingsService;
  let repository: Repository<Rating>;

  const mockRatingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: getRepositoryToken(Rating),
          useValue: mockRatingRepository,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    repository = module.get<Repository<Rating>>(getRepositoryToken(Rating));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new rating successfully', async () => {
      const createRatingDto: CreateRatingDto = {
        professionalId: 'prof-123',
        serviceRequestId: 'service-123',
        type: RatingType.CLIENT_TO_PROFESSIONAL,
        rating: 5,
        comment: 'Excelente servicio',
      };

      const mockRating = {
        id: 'rating-123',
        ...createRatingDto,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRatingRepository.findOne.mockResolvedValue(null);
      mockRatingRepository.create.mockReturnValue(mockRating);
      mockRatingRepository.save.mockResolvedValue(mockRating);

      const result = await service.create('user-123', createRatingDto);

      expect(result).toEqual(mockRating);
      expect(mockRatingRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          professionalId: createRatingDto.professionalId,
          serviceRequestId: createRatingDto.serviceRequestId,
          type: createRatingDto.type,
        },
      });
    });

    it('should throw BadRequestException if rating already exists', async () => {
      const createRatingDto: CreateRatingDto = {
        professionalId: 'prof-123',
        serviceRequestId: 'service-123',
        type: RatingType.CLIENT_TO_PROFESSIONAL,
        rating: 5,
      };

      mockRatingRepository.findOne.mockResolvedValue({ id: 'existing-rating' });

      await expect(service.create('user-123', createRatingDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a rating by id', async () => {
      const mockRating = {
        id: 'rating-123',
        rating: 5,
        comment: 'Great service',
      };

      mockRatingRepository.findOne.mockResolvedValue(mockRating);

      const result = await service.findOne('rating-123');

      expect(result).toEqual(mockRating);
    });

    it('should throw NotFoundException if rating not found', async () => {
      mockRatingRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a rating successfully', async () => {
      const mockRating = {
        id: 'rating-123',
        userId: 'user-123',
        rating: 4,
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        canBeEdited: jest.fn().mockReturnValue(true),
      };

      const updateRatingDto: UpdateRatingDto = {
        rating: 5,
        comment: 'Updated comment',
      };

      mockRatingRepository.findOne.mockResolvedValue(mockRating);
      mockRatingRepository.save.mockResolvedValue({ ...mockRating, ...updateRatingDto });

      const result = await service.update('rating-123', 'user-123', updateRatingDto);

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const mockRating = {
        id: 'rating-123',
        userId: 'other-user',
      };

      mockRatingRepository.findOne.mockResolvedValue(mockRating);

      await expect(
        service.update('rating-123', 'user-123', { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a rating successfully', async () => {
      const mockRating = {
        id: 'rating-123',
        userId: 'user-123',
        canBeDeleted: jest.fn().mockReturnValue(true),
      };

      mockRatingRepository.findOne.mockResolvedValue(mockRating);
      mockRatingRepository.remove.mockResolvedValue(undefined);

      await service.remove('rating-123', 'user-123');

      expect(mockRatingRepository.remove).toHaveBeenCalledWith(mockRating);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const mockRating = {
        id: 'rating-123',
        userId: 'other-user',
      };

      mockRatingRepository.findOne.mockResolvedValue(mockRating);

      await expect(service.remove('rating-123', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getAverageRating', () => {
    it('should return average rating statistics', async () => {
      const mockRatings = [
        { rating: 5, criteria: { punctuality: 5, quality: 4 } },
        { rating: 4, criteria: { punctuality: 4, quality: 5 } },
        { rating: 3, criteria: { punctuality: 3, quality: 3 } },
      ];

      mockRatingRepository.find.mockResolvedValue(mockRatings);

      const result = await service.getAverageRating('prof-123');

      expect(result.averageRating).toBe(4);
      expect(result.totalRatings).toBe(3);
      expect(result.ratingDistribution['5']).toBe(1);
      expect(result.ratingDistribution['4']).toBe(1);
      expect(result.ratingDistribution['3']).toBe(1);
    });

    it('should return default values when no ratings exist', async () => {
      mockRatingRepository.find.mockResolvedValue([]);

      const result = await service.getAverageRating('prof-123');

      expect(result.averageRating).toBe(0);
      expect(result.totalRatings).toBe(0);
      expect(result.ratingDistribution['1']).toBe(0);
    });
  });
});
