import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { ReportService } from '@modules/report/services/report.service';
import { NotificationsService } from '@api/notifications/services/notifications.service';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';

const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockFindAllForExport = jest.fn();
const mockFindNearby = jest.fn();
const mockFindById = jest.fn();
const mockFindByUserId = jest.fn();
const mockFindProfessionalIdByUserId = jest.fn();
const mockFindProfessionalByReferenceId = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateConditional = jest.fn();
const mockFindServices = jest.fn();
const mockFindReviews = jest.fn();
const mockGetStats = jest.fn();
const mockSearchBySkills = jest.fn();
const mockGetTopRated = jest.fn();
const mockGenerate = jest.fn();
const mockNotificationsCreate = jest.fn();

const mockProfessional = {
  id: 1,
  referenceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  userId: 10,
  categoryId: 2,
  isAvailable: true,
  status: 'APPROVED',
  isActive: true,
  verificationStatus: 'VERIFIED',
};

function fakeUser(overrides: { id?: number; permissions?: string[] } = {}) {
  return {
    id: overrides.id ?? 1,
    permissions: overrides.permissions ?? [],
  } as never;
}

describe('ProfessionalsService', () => {
  let service: ProfessionalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalsService,
        {
          provide: ProfessionalsDbService,
          useValue: {
            create: mockCreate,
            findMany: mockFindMany,
            findAllForExport: mockFindAllForExport,
            findNearby: mockFindNearby,
            findById: mockFindById,
            findByUserId: mockFindByUserId,
            findProfessionalIdByUserId: mockFindProfessionalIdByUserId,
            findProfessionalByReferenceId: mockFindProfessionalByReferenceId,
            update: mockUpdate,
            updateConditional: mockUpdateConditional,
            findServices: mockFindServices,
            findReviews: mockFindReviews,
            getStats: mockGetStats,
            searchBySkills: mockSearchBySkills,
            getTopRated: mockGetTopRated,
          },
        },
        {
          provide: ReportService,
          useValue: { generate: mockGenerate },
        },
        {
          provide: NotificationsService,
          useValue: { create: mockNotificationsCreate },
        },
      ],
    }).compile();

    service = module.get<ProfessionalsService>(ProfessionalsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('registerProfessional', () => {
    it('debe retornar el profesional creado desde la base de datos', async () => {
      // Arrange
      const dto = { categoryId: 2, bio: 'Plomero experto' } as never;
      mockCreate.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.registerProfessional(dto, 10);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(dto, 10);
      expect(result).toEqual(mockProfessional);
    });
  });

  describe('getProfessionals', () => {
    it('debe retornar lista de profesionales con filtros aplicados', async () => {
      // Arrange
      const query = {
        categoryId: 2,
        minRating: 4,
        isAvailable: true,
        page: 1,
        pageSize: 10,
      } as never;
      const mockResult = { data: [mockProfessional], pagination: { total: 1 } };
      mockFindMany.mockResolvedValue(mockResult);

      // Act
      const result = await service.getProfessionals(query, fakeUser());

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 2,
          minRating: 4,
          isAvailable: true,
        }),
        query,
      );
      expect(result).toEqual(mockResult);
    });

    it('debe pasar el filtro search tal cual (W-03)', async () => {
      // Arrange
      const query = { search: 'Juan Perez', page: 1, pageSize: 10 } as never;
      const mockResult = { data: [], pagination: { total: 0 } };
      mockFindMany.mockResolvedValue(mockResult);

      // Act
      await service.getProfessionals(query, fakeUser());

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Juan Perez' }),
        query,
      );
    });
  });

  describe('exportToCsv', () => {
    it('debe pedir los profesionales con los mismos filtros que getProfessionals, sin paginar', async () => {
      // Arrange
      const query = {
        categoryId: 2,
        minRating: 4,
        isAvailable: true,
      } as never;
      mockFindAllForExport.mockResolvedValue([
        {
          referenceId: mockProfessional.referenceId,
          user: {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@example.com',
          },
          category: { name: 'Plomería' },
          status: 'APPROVED',
          verificationStatus: 'VERIFIED',
          isAvailable: true,
          averageRating: 4.5,
          totalRatings: 10,
          hourlyRate: 50000,
          createdAt: new Date('2026-01-01'),
        },
      ]);
      mockGenerate.mockResolvedValue(Buffer.from('csv-content'));

      // Act
      const result = await service.exportToCsv(query);

      // Assert
      expect(mockFindAllForExport).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 2,
          minRating: 4,
          isAvailable: true,
        }),
      );
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              referenceId: mockProfessional.referenceId,
              firstName: 'Juan',
              lastName: 'Pérez',
              category: 'Plomería',
            }),
          ],
        }),
        { format: 'csv' },
      );
      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/^profesionales-\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe('getNearbyProfessionals', () => {
    it('debe retornar profesionales cercanos al punto geográfico indicado', async () => {
      // Arrange
      const query = {
        latitude: -25.2867,
        longitude: -57.647,
        radius: 10,
        categoryId: 2,
      };
      mockFindNearby.mockResolvedValue([mockProfessional]);

      // Act
      const result = await service.getNearbyProfessionals(query, fakeUser());

      // Assert
      expect(mockFindNearby).toHaveBeenCalledWith(
        query.latitude,
        query.longitude,
        query.radius,
        query.categoryId,
        true,
      );
      expect(result).toEqual([mockProfessional]);
    });
  });

  describe('getProfessionalById', () => {
    it('debe retornar el profesional cuando el ID existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getProfessionalById(1, fakeUser());

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfessional);
    });
  });

  describe('getProfessionalByReference', () => {
    it('debe retornar el profesional cuando el referenceId existe', async () => {
      // Arrange
      mockFindProfessionalByReferenceId.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getProfessionalByReference(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        fakeUser(),
      );

      // Assert
      expect(mockFindProfessionalByReferenceId).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );
      expect(result).toEqual(mockProfessional);
    });
  });

  describe('updateProfessionalByReference', () => {
    it('debe actualizar el profesional cuando el userId coincide con el dueño del perfil', async () => {
      // Arrange
      const dto = { bio: 'Nueva bio' } as never;
      const updatedProfessional = { ...mockProfessional, bio: 'Nueva bio' };
      mockFindProfessionalByReferenceId.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue(updatedProfessional);

      // Act
      const result = await service.updateProfessionalByReference(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        dto,
        10,
      );

      // Assert
      expect(mockFindProfessionalByReferenceId).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );
      expect(mockUpdate).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedProfessional);
    });

    it('debe lanzar ForbiddenException cuando el userId no coincide con el dueño del perfil', async () => {
      // Arrange
      const dto = { bio: 'Bio intento' } as never;
      mockFindProfessionalByReferenceId.mockResolvedValue({
        ...mockProfessional,
        userId: 99,
      });

      // Act & Assert
      await expect(
        service.updateProfessionalByReference(
          'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          dto,
          10,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getMyProfessionalProfile', () => {
    it('debe retornar el perfil profesional del usuario autenticado', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getMyProfessionalProfile(10);

      // Assert
      expect(mockFindByUserId).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockProfessional);
    });
  });

  describe('updateProfessional', () => {
    it('debe actualizar el profesional cuando el userId coincide', async () => {
      // Arrange
      const dto = { bio: 'Nueva bio' } as never;
      const updatedProfessional = { ...mockProfessional, bio: 'Nueva bio' };
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue(updatedProfessional);

      // Act
      const result = await service.updateProfessional(1, dto, 10);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockUpdate).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedProfessional);
    });

    it('debe lanzar ForbiddenException cuando el userId no coincide con el dueño del perfil', async () => {
      // Arrange
      const dto = { bio: 'Bio intento' } as never;
      mockFindById.mockResolvedValue({ ...mockProfessional, userId: 99 }); // dueño es userId=99

      // Act & Assert
      await expect(service.updateProfessional(1, dto, 10)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('updateAvailability', () => {
    it('debe actualizar la disponibilidad cuando el userId coincide', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue({ ...mockProfessional, isAvailable: false });

      // Act
      const result = await service.updateAvailability(1, false, 10);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(1, { isAvailable: false });
      expect(result).toBeDefined();
    });

    it('debe lanzar ForbiddenException cuando el userId no es el dueño', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockProfessional, userId: 55 });

      // Act & Assert
      await expect(service.updateAvailability(1, true, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateLocation', () => {
    it('debe actualizar la ubicación cuando el userId coincide', async () => {
      // Arrange
      const dto = { latitude: -25.3, longitude: -57.65 };
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdate.mockResolvedValue(mockProfessional);

      // Act
      await service.updateLocation(1, dto, 10);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          currentLatitude: dto.latitude,
          currentLongitude: dto.longitude,
        }),
      );
    });

    it('debe lanzar ForbiddenException cuando el userId no es el dueño', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockProfessional, userId: 55 });
      const dto = { latitude: -25.3, longitude: -57.65 };

      // Act & Assert
      await expect(service.updateLocation(1, dto as never, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('visibilidad de profesionales no aprobados (DEF-BE-023)', () => {
    const pending = { ...mockProfessional, status: 'PENDING' };

    it('debe responder NotFoundException a un cliente por id y por referenceId si el profesional no está APPROVED', async () => {
      // Arrange
      mockFindById.mockResolvedValue(pending);
      mockFindProfessionalByReferenceId.mockResolvedValue(pending);

      // Act & Assert
      await expect(
        service.getProfessionalById(1, fakeUser({ id: 99 })),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getProfessionalByReference('ref', fakeUser({ id: 99 })),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getProfessionalStats(1, fakeUser({ id: 99 })),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe tratar como no visible a un profesional APPROVED pero inactivo', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...mockProfessional, isActive: false });

      // Act & Assert
      await expect(
        service.getProfessionalById(1, fakeUser({ id: 99 })),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe permitirlo a admin, a un gestor de profesionales y al propio profesional', async () => {
      // Arrange
      mockFindById.mockResolvedValue(pending);

      // Act & Assert
      for (const viewer of [
        fakeUser({ id: 99, permissions: ['admin:all'] }),
        fakeUser({
          id: 99,
          permissions: ['professionals.verification:manage'],
        }),
        fakeUser({ id: mockProfessional.userId }),
      ]) {
        await expect(
          service.getProfessionalById(1, viewer),
        ).resolves.toBeDefined();
      }
    });

    it('debe pedir todos los estados (onlyApproved=false) a admin y solo APPROVED a un cliente', async () => {
      // Arrange
      mockFindMany.mockResolvedValue({ data: [], pagination: {} });
      mockFindNearby.mockResolvedValue([]);
      mockSearchBySkills.mockResolvedValue([]);
      mockGetTopRated.mockResolvedValue([]);
      const admin = fakeUser({ id: 1, permissions: ['admin:all'] });
      const client = fakeUser({ id: 2 });

      // Act
      await service.getProfessionals({} as never, admin);
      await service.getProfessionals({} as never, client);
      await service.searchBySkills({ skills: 'a' } as never, admin);
      await service.getTopRatedProfessionals({} as never, admin);

      // Assert
      expect(mockFindMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ onlyApproved: false }),
        {},
      );
      expect(mockFindMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ onlyApproved: true }),
        {},
      );
      expect(mockSearchBySkills).toHaveBeenCalledWith(
        ['a'],
        { skills: 'a' },
        false,
      );
      expect(mockGetTopRated).toHaveBeenCalledWith(undefined, undefined, false);
    });
  });

  describe('getProfessionalServices', () => {
    it('debe retornar los servicios del profesional paginados', async () => {
      // Arrange
      const query = { page: 1, pageSize: 10, status: 'COMPLETED' };
      const mockResult = { data: [], pagination: { total: 0 } };
      mockFindServices.mockResolvedValue(mockResult);
      mockFindById.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getProfessionalServices(
        1,
        query as never,
        fakeUser(),
      );

      // Assert
      expect(mockFindServices).toHaveBeenCalledWith(1, query, query.status);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getProfessionalReviews', () => {
    const pagination = { total: 0, page: 1, pageSize: 5, totalPages: 0 };

    it('debe retornar las reseñas del profesional mapeadas (sin exponer la fila cruda de Users)', async () => {
      // Arrange
      const query = { page: 1, pageSize: 5 } as never;
      mockFindReviews.mockResolvedValue({
        data: [
          {
            referenceId: 'rating-uuid-1',
            userId: 3,
            professionalId: 1,
            type: 'CLIENT_TO_PROFESSIONAL',
            rating: 4.5,
            review: 'Excelente',
            isAnonymous: false,
            createdAt: new Date('2026-01-01'),
            user: {
              id: 3,
              email: 'cliente@example.com',
              firstName: 'Juan',
              lastName: 'Pérez',
              phoneNumber: null,
              password: 'nunca-deberia-salir',
            },
          },
        ],
        pagination,
      });
      mockFindProfessionalIdByUserId.mockResolvedValue(null);
      mockFindById.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getProfessionalReviews(
        1,
        query,
        fakeUser({ id: 99 }),
      );

      // Assert
      expect(mockFindReviews).toHaveBeenCalledWith(1, query);
      expect(result.pagination).toEqual(pagination);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'rating-uuid-1',
        userId: 3,
        rating: 4.5,
        review: 'Excelente',
        type: 'CLIENT_TO_PROFESSIONAL',
        isAnonymous: false,
        createdAt: new Date('2026-01-01'),
        user: {
          id: 3,
          email: 'cliente@example.com',
          firstName: 'Juan',
          lastName: 'Pérez',
          phoneNumber: null,
        },
      });
    });

    it('debe ocultar el usuario cuando la reseña es anónima y quien consulta no es el autor ni tiene permiso de auditoría', async () => {
      // Arrange
      mockFindReviews.mockResolvedValue({
        data: [
          {
            referenceId: 'rating-uuid-2',
            userId: 3,
            professionalId: 1,
            type: 'CLIENT_TO_PROFESSIONAL',
            rating: 5,
            review: null,
            isAnonymous: true,
            createdAt: new Date('2026-01-01'),
            user: {
              id: 3,
              email: 'cliente@example.com',
              firstName: 'Juan',
              lastName: 'Pérez',
              phoneNumber: null,
            },
          },
        ],
        pagination,
      });
      mockFindProfessionalIdByUserId.mockResolvedValue(null);
      mockFindById.mockResolvedValue(mockProfessional);

      // Act — viewer id=99, sin permiso de auditoría, no es el autor (autor es userId=3)
      const result = await service.getProfessionalReviews(
        1,
        {} as never,
        fakeUser({ id: 99 }),
      );

      // Assert
      expect(result.data[0].user).toBeNull();
    });

    it('NO debe ocultar el usuario cuando quien consulta tiene permiso de auditoría de ratings', async () => {
      // Arrange
      mockFindReviews.mockResolvedValue({
        data: [
          {
            referenceId: 'rating-uuid-3',
            userId: 3,
            professionalId: 1,
            type: 'CLIENT_TO_PROFESSIONAL',
            rating: 3,
            review: null,
            isAnonymous: true,
            createdAt: new Date('2026-01-01'),
            user: {
              id: 3,
              email: 'cliente@example.com',
              firstName: 'Juan',
              lastName: 'Pérez',
              phoneNumber: null,
            },
          },
        ],
        pagination,
      });
      mockFindProfessionalIdByUserId.mockResolvedValue(null);
      mockFindById.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getProfessionalReviews(
        1,
        {} as never,
        fakeUser({ id: 99, permissions: ['ratings.audit:read'] }),
      );

      // Assert
      expect(result.data[0].user).not.toBeNull();
    });
  });

  describe('getProfessionalStats', () => {
    it('debe retornar las estadísticas del profesional', async () => {
      // Arrange
      const mockStats = {
        totalServices: 50,
        completedServices: 45,
        averageRating: 4.8,
      };
      mockGetStats.mockResolvedValue(mockStats);
      mockFindById.mockResolvedValue(mockProfessional);

      // Act
      const result = await service.getProfessionalStats(1, fakeUser());

      // Assert
      expect(mockGetStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStats);
    });
  });

  describe('searchBySkills', () => {
    it('debe buscar profesionales por skills separadas por coma', async () => {
      // Arrange
      const query = {
        skills: 'plomería, electricidad, pintura',
        page: 1,
      } as never;
      mockSearchBySkills.mockResolvedValue([mockProfessional]);

      // Act
      const result = await service.searchBySkills(query, fakeUser());

      // Assert
      expect(mockSearchBySkills).toHaveBeenCalledWith(
        ['plomería', 'electricidad', 'pintura'],
        query,
        true,
      );
      expect(result).toEqual([mockProfessional]);
    });

    it('debe manejar una skill única sin comas', async () => {
      // Arrange
      const query = { skills: 'plomería', page: 1 } as never;
      mockSearchBySkills.mockResolvedValue([]);

      // Act
      await service.searchBySkills(query, fakeUser());

      // Assert
      expect(mockSearchBySkills).toHaveBeenCalledWith(
        ['plomería'],
        query,
        true,
      );
    });
  });

  describe('getTopRatedProfessionals', () => {
    it('debe retornar los profesionales mejor calificados con limit aplicado', async () => {
      // Arrange
      const query = { categoryId: 2, limit: 5 };
      mockGetTopRated.mockResolvedValue([mockProfessional]);

      // Act
      const result = await service.getTopRatedProfessionals(query, fakeUser());

      // Assert
      expect(mockGetTopRated).toHaveBeenCalledWith(
        query.categoryId,
        query.limit,
        true,
      );
      expect(result).toEqual([mockProfessional]);
    });
  });

  describe('verifyProfessional', () => {
    const pendingProfessional = {
      ...mockProfessional,
      status: 'PENDING',
      verificationStatus: 'UNVERIFIED',
    };

    it.each(['APPROVED', 'SUSPENDED'])(
      'debe lanzar ConflictException (DEF-BE-028) y no escribir si el profesional está %s',
      async (status) => {
        mockFindById.mockResolvedValue({ ...mockProfessional, status });

        await expect(
          service.verifyProfessional(1, { isVerified: true }, 99),
        ).rejects.toThrow(ConflictException);
        expect(mockUpdateConditional).not.toHaveBeenCalled();
        expect(mockNotificationsCreate).not.toHaveBeenCalled();
      },
    );

    it('debe permitir revisar de nuevo un profesional REJECTED', async () => {
      mockFindById
        .mockResolvedValueOnce({ ...mockProfessional, status: 'REJECTED' })
        .mockResolvedValueOnce(mockProfessional);
      mockUpdateConditional.mockResolvedValue(1);

      await service.verifyProfessional(1, { isVerified: true }, 99);

      expect(mockUpdateConditional).toHaveBeenCalledWith(
        1,
        ['REJECTED'],
        expect.objectContaining({ status: 'APPROVED' }),
      );
    });

    it('debe marcar el profesional como verificado cuando isVerified=true', async () => {
      // Arrange
      const dto = { isVerified: true, notes: 'Documentos válidos' } as never;
      mockFindById
        .mockResolvedValueOnce(pendingProfessional)
        .mockResolvedValueOnce({
          ...pendingProfessional,
          verificationStatus: 'VERIFIED',
          status: 'APPROVED',
        });
      mockUpdateConditional.mockResolvedValue(1);

      // Act
      const result = await service.verifyProfessional(1, dto, 99);

      // Assert
      expect(mockUpdateConditional).toHaveBeenCalledWith(
        1,
        [pendingProfessional.status],
        expect.objectContaining({
          verificationStatus: 'VERIFIED',
          status: 'APPROVED',
          changedReason: 'Documentos válidos',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          status: 'APPROVED',
          verificationStatus: 'VERIFIED',
        }),
      );
      // I-05 (#33, IMPRESCINDIBLE): el profesional se entera de que ya puede operar.
      expect(mockNotificationsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.PROFESSIONAL_VERIFIED,
        }),
        pendingProfessional.userId,
      );
    });

    it('debe marcar el profesional como rechazado cuando isVerified=false', async () => {
      // Arrange
      const dto = { isVerified: false, notes: 'Documentos inválidos' } as never;
      mockFindById.mockResolvedValue(pendingProfessional);
      mockUpdateConditional.mockResolvedValue(1);

      // Act
      await service.verifyProfessional(1, dto, 99);

      // Assert
      expect(mockUpdateConditional).toHaveBeenCalledWith(
        1,
        [pendingProfessional.status],
        expect.objectContaining({
          verificationStatus: 'REJECTED',
          status: 'REJECTED',
        }),
      );
      expect(mockNotificationsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.PROFESSIONAL_VERIFICATION_REJECTED,
        }),
        pendingProfessional.userId,
      );
    });

    it('debe lanzar ConflictException si el estado cambió entre la lectura y la escritura (carrera)', async () => {
      // Arrange — dos admins resolviendo la misma verificación al mismo tiempo: el segundo
      // `updateMany` no encuentra ninguna fila con el estado leído, count() vuelve 0.
      const dto = { isVerified: true, notes: 'Documentos válidos' } as never;
      mockFindById.mockResolvedValue(pendingProfessional);
      mockUpdateConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(service.verifyProfessional(1, dto, 99)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUpdateConditional).toHaveBeenCalledWith(
        1,
        [pendingProfessional.status],
        expect.objectContaining({ status: 'APPROVED' }),
      );
    });
  });

  describe('suspendProfessional', () => {
    it.each(['SUSPENDED', 'PENDING', 'REJECTED'])(
      'debe lanzar ConflictException (DEF-BE-029) y no escribir si el profesional está %s',
      async (status) => {
        mockFindById.mockResolvedValue({ ...mockProfessional, status });

        await expect(
          service.suspendProfessional(1, 'motivo', 99),
        ).rejects.toThrow(ConflictException);
        expect(mockUpdateConditional).not.toHaveBeenCalled();
        expect(mockNotificationsCreate).not.toHaveBeenCalled();
      },
    );

    it('debe suspender el profesional con la razón indicada', async () => {
      // Arrange
      mockFindById
        .mockResolvedValueOnce(mockProfessional)
        .mockResolvedValueOnce({
          ...mockProfessional,
          status: 'SUSPENDED',
          isActive: false,
        });
      mockUpdateConditional.mockResolvedValue(1);

      // Act
      const result = await service.suspendProfessional(
        1,
        'Comportamiento inadecuado',
        99,
      );

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockUpdateConditional).toHaveBeenCalledWith(
        1,
        [mockProfessional.status],
        expect.objectContaining({
          status: 'SUSPENDED',
          isActive: false,
          changedReason: 'Comportamiento inadecuado',
          lastChangedBy: '99',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({ status: 'SUSPENDED', isActive: false }),
      );
      // I-05 (#34, IMPRESCINDIBLE): necesita saber por qué dejó de poder operar.
      expect(mockNotificationsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.PROFESSIONAL_SUSPENDED,
        }),
        mockProfessional.userId,
      );
    });

    it('debe lanzar ConflictException si el estado cambió entre la lectura y la escritura (carrera)', async () => {
      // Arrange — ej. el profesional ya fue suspendido por otro admin, o se reactivó, entre
      // la lectura de validación y esta escritura: el `updateMany` condicional no afecta filas.
      mockFindById.mockResolvedValue(mockProfessional);
      mockUpdateConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.suspendProfessional(1, 'Comportamiento inadecuado', 99),
      ).rejects.toThrow(ConflictException);
    });
  });
});
