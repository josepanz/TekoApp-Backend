import { Test, TestingModule } from '@nestjs/testing';
import { RatingType } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { RatingsDbService } from './ratings-db.service';

// ─── Mocks de professionals / users / services ───────────────────────────────
const mockProfessionalsFindFirst = jest.fn();
const mockProfessionalsFindUnique = jest.fn();
const mockUsersFindUnique = jest.fn();
const mockServicesFindUnique = jest.fn();

// ─── Mocks de rating ─────────────────────────────────────────────────────────
const mockRatingFindFirst = jest.fn();
const mockRatingFindMany = jest.fn();
const mockRatingFindUnique = jest.fn();
const mockRatingCreate = jest.fn();
const mockRatingUpdate = jest.fn();
const mockRatingAggregate = jest.fn();
const mockRatingGroupBy = jest.fn();

const mockPrisma = {
  extended: {
    professionals: {
      findFirst: mockProfessionalsFindFirst,
      findUnique: mockProfessionalsFindUnique,
    },
    users: {
      findUnique: mockUsersFindUnique,
    },
    services: {
      findUnique: mockServicesFindUnique,
    },
    rating: {
      findFirst: mockRatingFindFirst,
      findMany: mockRatingFindMany,
      findUnique: mockRatingFindUnique,
      create: mockRatingCreate,
      update: mockRatingUpdate,
      aggregate: mockRatingAggregate,
      groupBy: mockRatingGroupBy,
    },
  },
};

describe('RatingsDbService', () => {
  let service: RatingsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RatingsDbService>(RatingsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findProfessionalByUserRef ───────────────────────────────────────────
  describe('findProfessionalByUserRef', () => {
    it('debe retornar el id del profesional cuando existe el referenceId', async () => {
      // Arrange
      const expected = { id: 1 };
      mockProfessionalsFindFirst.mockResolvedValue(expected);

      // Act
      const result = await service.findProfessionalByUserRef('ref-uuid-123');

      // Assert
      expect(result).toEqual(expected);
      expect(mockProfessionalsFindFirst).toHaveBeenCalledWith({
        where: { user: { referenceId: 'ref-uuid-123' } },
        select: { id: true },
      });
    });

    it('debe retornar null cuando no existe ningún profesional con ese referenceId', async () => {
      // Arrange
      mockProfessionalsFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findProfessionalByUserRef('no-existe');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── findServiceByReferenceId ────────────────────────────────────────────
  describe('findServiceByReferenceId', () => {
    it('debe resolver el UUID público del servicio a su PK interna', async () => {
      // Arrange
      mockServicesFindUnique.mockResolvedValue({ id: 30 });

      // Act
      const result = await service.findServiceByReferenceId('svc-uuid-1');

      // Assert
      expect(result).toEqual({ id: 30 });
      expect(mockServicesFindUnique).toHaveBeenCalledWith({
        where: { referenceId: 'svc-uuid-1' },
        select: { id: true },
      });
    });
  });

  // ─── findDuplicate ───────────────────────────────────────────────────────
  describe('findDuplicate', () => {
    it('debe retornar la calificación existente cuando ya fue creada para esa combinación', async () => {
      // Arrange
      const existingRating = { id: 1, userId: 1, professionalId: 2 };
      mockRatingFindFirst.mockResolvedValue(existingRating);

      // Act
      const result = await service.findDuplicate(
        1,
        2,
        30,
        RatingType.CLIENT_TO_PROFESSIONAL,
      );

      // Assert
      expect(result).toEqual(existingRating);
      expect(mockRatingFindFirst).toHaveBeenCalledWith({
        where: {
          userId: 1,
          professionalId: 2,
          serviceId: 30,
          type: RatingType.CLIENT_TO_PROFESSIONAL,
        },
      });
    });

    it('debe retornar null cuando no existe calificación duplicada', async () => {
      // Arrange
      mockRatingFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findDuplicate(
        1,
        2,
        undefined,
        RatingType.PROFESSIONAL_TO_CLIENT,
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────
  describe('create', () => {
    it('debe retornar la calificación creada incluyendo el servicio', async () => {
      // Arrange
      const data = {
        userId: 1,
        professionalId: 2,
        rating: 5,
        type: RatingType.CLIENT_TO_PROFESSIONAL,
      };
      const created = { id: 1, referenceId: 'rating-uuid-1', ...data };
      mockRatingCreate.mockResolvedValue(created);

      // Act
      const result = await service.create(data);

      // Assert
      expect(result).toEqual(created);
      expect(mockRatingCreate).toHaveBeenCalledWith({
        data,
        include: { service: true },
      });
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('debe retornar todas las calificaciones con sus relaciones incluidas', async () => {
      // Arrange
      const ratings = [
        { id: 1, rating: 4 },
        { id: 2, rating: 5 },
      ];
      mockRatingFindMany.mockResolvedValue(ratings);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(ratings);
      expect(mockRatingFindMany).toHaveBeenCalledWith({
        include: { user: true, professional: true, service: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findRecent ──────────────────────────────────────────────────────────
  describe('findRecent', () => {
    it('debe retornar las últimas N calificaciones limitadas por el parámetro', async () => {
      // Arrange
      const ratings = [{ id: 1 }, { id: 2 }, { id: 3 }];
      mockRatingFindMany.mockResolvedValue(ratings);

      // Act
      const result = await service.findRecent(3);

      // Assert
      expect(result).toEqual(ratings);
      expect(mockRatingFindMany).toHaveBeenCalledWith({
        include: { user: true, professional: true, service: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
    });
  });

  // ─── findByUser ──────────────────────────────────────────────────────────
  describe('findByUser', () => {
    it('debe retornar todas las calificaciones del usuario especificado', async () => {
      // Arrange
      const ratings = [{ id: 1, userId: 10 }];
      mockRatingFindMany.mockResolvedValue(ratings);

      // Act
      const result = await service.findByUser(10);

      // Assert
      expect(result).toEqual(ratings);
      expect(mockRatingFindMany).toHaveBeenCalledWith({
        where: { userId: 10 },
        include: { professional: true, service: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findByProfessional ──────────────────────────────────────────────────
  describe('findByProfessional', () => {
    it('debe retornar solo las calificaciones activas del profesional', async () => {
      // Arrange
      const ratings = [{ id: 1, professionalId: 5, isActive: true }];
      mockRatingFindMany.mockResolvedValue(ratings);

      // Act
      const result = await service.findByProfessional(5);

      // Assert
      expect(result).toEqual(ratings);
      expect(mockRatingFindMany).toHaveBeenCalledWith({
        where: { professionalId: 5, isActive: true },
        include: { user: true, service: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findClientRatings ───────────────────────────────────────────────────
  describe('findClientRatings', () => {
    it('debe retornar calificaciones de clientes hacia el profesional, solo públicas y activas', async () => {
      // Arrange
      const ratings = [
        {
          id: 1,
          type: RatingType.CLIENT_TO_PROFESSIONAL,
          isAnonymous: false,
          isActive: true,
        },
      ];
      mockRatingFindMany.mockResolvedValue(ratings);

      // Act
      const result = await service.findClientRatings(7);

      // Assert
      expect(result).toEqual(ratings);
      expect(mockRatingFindMany).toHaveBeenCalledWith({
        where: {
          professionalId: 7,
          type: RatingType.CLIENT_TO_PROFESSIONAL,
          isAnonymous: false,
          isActive: true,
        },
        include: { user: true, service: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findProfessionalRatings ─────────────────────────────────────────────
  describe('findProfessionalRatings', () => {
    it('debe retornar calificaciones del profesional hacia usuarios, solo públicas y activas', async () => {
      // Arrange
      const ratings = [
        {
          id: 1,
          type: RatingType.PROFESSIONAL_TO_CLIENT,
          isAnonymous: false,
          isActive: true,
        },
      ];
      mockRatingFindMany.mockResolvedValue(ratings);

      // Act
      const result = await service.findProfessionalRatings(3);

      // Assert
      expect(result).toEqual(ratings);
      expect(mockRatingFindMany).toHaveBeenCalledWith({
        where: {
          userId: 3,
          type: RatingType.PROFESSIONAL_TO_CLIENT,
          isAnonymous: false,
          isActive: true,
        },
        include: { professional: true, service: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findByServiceId ─────────────────────────────────────────────────────
  describe('findByServiceId', () => {
    it('debe retornar todas las calificaciones activas de un servicio específico (por PK interna)', async () => {
      // Arrange
      const ratings = [{ id: 1, serviceId: 30, isActive: true }];
      mockRatingFindMany.mockResolvedValue(ratings);

      // Act
      const result = await service.findByServiceId(30);

      // Assert
      expect(result).toEqual(ratings);
      expect(mockRatingFindMany).toHaveBeenCalledWith({
        where: { serviceId: 30, isActive: true },
        include: { user: true, professional: true, service: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('debe retornar la calificación con todas las relaciones cuando existe la PK interna', async () => {
      // Arrange
      const rating = { id: 1, rating: 5 };
      mockRatingFindUnique.mockResolvedValue(rating);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(rating);
      expect(mockRatingFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: true, professional: true, service: true },
      });
    });

    it('debe retornar null cuando no existe ninguna calificación con ese id', async () => {
      // Arrange
      mockRatingFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── findByReferenceId ───────────────────────────────────────────────────
  describe('findByReferenceId', () => {
    it('debe buscar la calificación por su referenceId (UUID público) con sus relaciones', async () => {
      // Arrange
      const rating = { id: 1, referenceId: 'rating-uuid-1', rating: 5 };
      mockRatingFindUnique.mockResolvedValue(rating);

      // Act
      const result = await service.findByReferenceId('rating-uuid-1');

      // Assert
      expect(result).toEqual(rating);
      expect(mockRatingFindUnique).toHaveBeenCalledWith({
        where: { referenceId: 'rating-uuid-1' },
        include: { user: true, professional: true, service: true },
      });
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────
  describe('update', () => {
    it('debe retornar la calificación actualizada con los datos provistos', async () => {
      // Arrange
      const updated = { id: 1, rating: 3 };
      mockRatingUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.update(1, { rating: 3 });

      // Assert
      expect(result).toEqual(updated);
      expect(mockRatingUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { rating: 3 },
        include: { service: true },
      });
    });
  });

  // ─── deactivate ──────────────────────────────────────────────────────────
  describe('deactivate', () => {
    it('debe marcar la calificación como inactiva sin retornar valor', async () => {
      // Arrange
      mockRatingUpdate.mockResolvedValue({ id: 1, isActive: false });

      // Act
      await service.deactivate(1);

      // Assert
      expect(mockRatingUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
    });
  });

  // ─── report ──────────────────────────────────────────────────────────────
  describe('report', () => {
    it('debe marcar la calificación como reportada con la razón indicada', async () => {
      // Arrange
      const reported = { id: 1, isReported: true, reportReason: 'ofensivo' };
      mockRatingUpdate.mockResolvedValue(reported);

      // Act
      const result = await service.report(1, 'ofensivo');

      // Assert
      expect(result).toEqual(reported);
      expect(mockRatingUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isReported: true, reportReason: 'ofensivo' },
        include: { service: true },
      });
    });
  });

  // ─── aggregateUserStats ──────────────────────────────────────────────────
  describe('aggregateUserStats', () => {
    it('debe retornar un arreglo con los agregados de calificaciones dadas y recibidas del usuario', async () => {
      // Arrange
      const givenAggregate = { _count: { id: 5 }, _avg: { rating: 4.2 } };
      const receivedAggregate = { _count: { id: 3 }, _avg: { rating: 3.8 } };
      mockRatingAggregate
        .mockResolvedValueOnce(givenAggregate)
        .mockResolvedValueOnce(receivedAggregate);

      // Act
      const result = await service.aggregateUserStats(10);

      // Assert
      expect(result).toEqual([givenAggregate, receivedAggregate]);
      expect(mockRatingAggregate).toHaveBeenCalledTimes(2);
      expect(mockRatingAggregate).toHaveBeenNthCalledWith(1, {
        where: { userId: 10 },
        _count: { id: true },
        _avg: { rating: true },
      });
      expect(mockRatingAggregate).toHaveBeenNthCalledWith(2, {
        where: { professionalId: 10 },
        _count: { id: true },
        _avg: { rating: true },
      });
    });
  });

  // ─── getAggregateAndRatings ──────────────────────────────────────────────
  describe('getAggregateAndRatings', () => {
    it('debe retornar el agregado y la lista de calificaciones del profesional en paralelo', async () => {
      // Arrange
      const aggregate = { _avg: { rating: 4.5 }, _count: { id: 10 } };
      const ratings = [
        { rating: 5, criteria: {} },
        { rating: 4, criteria: {} },
      ];
      mockRatingAggregate.mockResolvedValue(aggregate);
      mockRatingFindMany.mockResolvedValue(ratings);

      // Act
      const result = await service.getAggregateAndRatings(7);

      // Assert
      expect(result).toEqual([aggregate, ratings]);
      expect(mockRatingAggregate).toHaveBeenCalledWith({
        where: {
          professionalId: 7,
          type: RatingType.CLIENT_TO_PROFESSIONAL,
          isActive: true,
        },
        _avg: { rating: true },
        _count: { id: true },
      });
      expect(mockRatingFindMany).toHaveBeenCalledWith({
        where: {
          professionalId: 7,
          type: RatingType.CLIENT_TO_PROFESSIONAL,
          isActive: true,
        },
        select: { rating: true, criteria: true },
      });
    });
  });

  // ─── groupTopRated ───────────────────────────────────────────────────────
  describe('groupTopRated', () => {
    it('debe retornar los profesionales mejor calificados agrupados por id respetando el límite', async () => {
      // Arrange
      const grouped = [
        { professionalId: 1, _avg: { rating: 4.9 }, _count: { id: 15 } },
        { professionalId: 3, _avg: { rating: 4.7 }, _count: { id: 8 } },
      ];
      mockRatingGroupBy.mockResolvedValue(grouped);

      // Act
      const result = await service.groupTopRated(5);

      // Assert
      expect(result).toEqual(grouped);
      expect(mockRatingGroupBy).toHaveBeenCalledWith({
        by: ['professionalId'],
        where: { type: RatingType.CLIENT_TO_PROFESSIONAL, isActive: true },
        _avg: { rating: true },
        _count: { id: true },
        having: { rating: { _count: { gte: 3 } } },
        orderBy: { _avg: { rating: 'desc' } },
        take: 5,
      });
    });
  });
});
