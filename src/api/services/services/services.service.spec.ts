import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ServiceStatus, RequestStatus } from '@prisma/client';
import { ServicesService } from './services.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';

const mockFindCategoryById = jest.fn();
const mockCreateService = jest.fn();
const mockFindManyWithCount = jest.fn();
const mockFindNearby = jest.fn();
const mockFindServiceById = jest.fn();
const mockUpdateService = jest.fn();
const mockFindMyServices = jest.fn();
const mockFindProfessionalById = jest.fn();
const mockFindProfessionalByUserId = jest.fn();
const mockFindUserById = jest.fn();
const mockCountServices = jest.fn();
const mockAggregateEarnings = jest.fn();
const mockFindDuplicateRequest = jest.fn();
const mockCreateServiceRequest = jest.fn();
const mockFindServiceRequests = jest.fn();
const mockFindServiceRequest = jest.fn();
const mockFindServiceRequestById = jest.fn();
const mockUpdateServiceRequest = jest.fn();
const mockAcceptRequestTransaction = jest.fn();

const mockService = {
  id: 'svc-001',
  userId: 1,
  professionalId: null,
  title: 'Reparación de cañería',
  status: ServiceStatus.PENDING,
  hourlyRate: null,
  startedAt: null,
};

const mockProfessional = { id: 5, userId: 10 };
const mockCategory = { id: 2, name: 'Plomería' };

describe('ServicesService', () => {
  let service: ServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: ServicesDbService,
          useValue: {
            findCategoryById: mockFindCategoryById,
            createService: mockCreateService,
            findManyWithCount: mockFindManyWithCount,
            findNearby: mockFindNearby,
            findServiceById: mockFindServiceById,
            updateService: mockUpdateService,
            findMyServices: mockFindMyServices,
            findProfessionalById: mockFindProfessionalById,
            findProfessionalByUserId: mockFindProfessionalByUserId,
            findUserById: mockFindUserById,
            countServices: mockCountServices,
            aggregateEarnings: mockAggregateEarnings,
            findDuplicateRequest: mockFindDuplicateRequest,
            createServiceRequest: mockCreateServiceRequest,
            findServiceRequests: mockFindServiceRequests,
            findServiceRequest: mockFindServiceRequest,
            findServiceRequestById: mockFindServiceRequestById,
            updateServiceRequest: mockUpdateServiceRequest,
            acceptRequestTransaction: mockAcceptRequestTransaction,
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createService', () => {
    it('debe crear el servicio cuando la categoría existe', async () => {
      // Arrange
      const dto = {
        categoryId: 2,
        title: 'Reparación',
        description: 'desc',
        images: [],
      } as never;
      mockFindCategoryById.mockResolvedValue(mockCategory);
      mockCreateService.mockResolvedValue(mockService);

      // Act
      const result = await service.createService(dto, 1);

      // Assert
      expect(mockFindCategoryById).toHaveBeenCalledWith(2);
      expect(mockCreateService).toHaveBeenCalled();
      expect(result).toEqual(mockService);
    });

    it('debe lanzar NotFoundException cuando la categoría no existe', async () => {
      // Arrange
      const dto = { categoryId: 999 } as never;
      mockFindCategoryById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createService(dto, 1)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCreateService).not.toHaveBeenCalled();
    });
  });

  describe('getServices', () => {
    it('debe retornar lista de servicios con paginación por defecto', async () => {
      // Arrange
      mockFindManyWithCount.mockResolvedValue([[mockService], 1]);

      // Act
      const result = await service.getServices({} as never);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });

    it('debe aplicar filtros de status y categoría cuando se proveen', async () => {
      // Arrange
      const filters = {
        status: ServiceStatus.PENDING,
        categoryId: 2,
        page: 2,
        pageSize: 5,
      } as never;
      mockFindManyWithCount.mockResolvedValue([[], 0]);

      // Act
      await service.getServices(filters);

      // Assert
      expect(mockFindManyWithCount).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ServiceStatus.PENDING,
          categoryId: 2,
        }),
        2,
        5,
      );
    });
  });

  describe('getNearbyServices', () => {
    it('debe retornar servicios cercanos en estado PENDING', async () => {
      // Arrange
      mockFindNearby.mockResolvedValue([mockService]);

      // Act
      const result = await service.getNearbyServices(-25.2867, -57.647, 10);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindNearby).toHaveBeenCalledWith(
        expect.objectContaining({ status: ServiceStatus.PENDING }),
      );
    });
  });

  describe('getServiceById', () => {
    it('debe retornar el servicio cuando el ID existe', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue(mockService);

      // Act
      const result = await service.getServiceById('svc-001');

      // Assert
      expect(result).toEqual(mockService);
      expect(mockFindServiceById).toHaveBeenCalledWith('svc-001');
    });

    it('debe lanzar NotFoundException cuando el servicio no existe', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getServiceById('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateService', () => {
    it('debe actualizar el servicio cuando el userId es el dueño y el estado es modificable', async () => {
      // Arrange
      const svcPending = {
        ...mockService,
        status: ServiceStatus.PENDING,
        userId: 1,
      };
      mockFindServiceById.mockResolvedValue(svcPending);
      mockUpdateService.mockResolvedValue({
        ...svcPending,
        title: 'Nuevo título',
      });
      const dto = { title: 'Nuevo título' } as never;

      // Act
      const result = await service.updateService('svc-001', dto, 1);

      // Assert
      expect(mockUpdateService).toHaveBeenCalledWith('svc-001', dto);
      expect(result).toBeDefined();
    });

    it('debe lanzar ForbiddenException cuando el userId no es el dueño', async () => {
      // Arrange
      const svc = { ...mockService, userId: 99, professionalId: null };
      mockFindServiceById.mockResolvedValue(svc);

      // Act & Assert
      await expect(service.updateService('svc-001', {}, 1)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUpdateService).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando el estado no es modificable (COMPLETED)', async () => {
      // Arrange
      const svcCompleted = {
        ...mockService,
        status: ServiceStatus.COMPLETED,
        userId: 1,
      };
      mockFindServiceById.mockResolvedValue(svcCompleted);

      // Act & Assert
      await expect(service.updateService('svc-001', {}, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelService', () => {
    it('debe cancelar el servicio cuando el dueño lo solicita y el estado es cancelable', async () => {
      // Arrange
      const svc = {
        ...mockService,
        status: ServiceStatus.PENDING,
        userId: 1,
        professionalId: null,
      };
      mockFindServiceById.mockResolvedValue(svc);
      mockUpdateService.mockResolvedValue({
        ...svc,
        status: ServiceStatus.CANCELLED,
      });

      // Act
      await service.cancelService('svc-001', 'Ya no lo necesito', 1);

      // Assert
      expect(mockUpdateService).toHaveBeenCalledWith(
        'svc-001',
        expect.objectContaining({ status: ServiceStatus.CANCELLED }),
      );
    });

    it('debe lanzar BadRequestException cuando el servicio ya está completado', async () => {
      // Arrange
      const svcCompleted = { ...mockService, status: ServiceStatus.COMPLETED };
      mockFindServiceById.mockResolvedValue(svcCompleted);

      // Act & Assert
      await expect(
        service.cancelService('svc-001', 'razón', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ForbiddenException cuando ni el cliente ni el profesional son el solicitante', async () => {
      // Arrange
      const svc = {
        ...mockService,
        status: ServiceStatus.PENDING,
        userId: 99,
        professionalId: 5,
      };
      mockFindServiceById.mockResolvedValue(svc);
      mockFindProfessionalById.mockResolvedValue({ id: 5, userId: 88 });

      // Act & Assert
      await expect(
        service.cancelService('svc-001', 'razón', 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('acceptService', () => {
    it('debe aceptar el servicio y asignar al profesional', async () => {
      // Arrange
      const svcPending = { ...mockService, status: ServiceStatus.PENDING };
      mockFindServiceById.mockResolvedValue(svcPending);
      mockFindProfessionalById.mockResolvedValue(mockProfessional);
      mockUpdateService.mockResolvedValue({
        ...svcPending,
        status: ServiceStatus.ACCEPTED,
        professionalId: 5,
      });

      // Act
      const result = await service.acceptService('svc-001', 5);

      // Assert
      expect(mockUpdateService).toHaveBeenCalledWith(
        'svc-001',
        expect.objectContaining({
          status: ServiceStatus.ACCEPTED,
          professionalId: 5,
        }),
      );
      expect(result).toBeDefined();
    });

    it('debe lanzar BadRequestException cuando el servicio no está en estado PENDING', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ACCEPTED,
      });

      // Act & Assert
      await expect(service.acceptService('svc-001', 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar ForbiddenException cuando el profesional no existe en el sistema', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue(mockService);
      mockFindProfessionalById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.acceptService('svc-001', 999)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('startService', () => {
    it('debe iniciar el servicio cuando el profesional asignado lo solicita', async () => {
      // Arrange
      const svcAccepted = {
        ...mockService,
        status: ServiceStatus.ACCEPTED,
        professionalId: 5,
      };
      mockFindServiceById.mockResolvedValue(svcAccepted);
      mockUpdateService.mockResolvedValue({
        ...svcAccepted,
        status: ServiceStatus.IN_PROGRESS,
      });

      // Act
      await service.startService('svc-001', 5);

      // Assert
      expect(mockUpdateService).toHaveBeenCalledWith(
        'svc-001',
        expect.objectContaining({ status: ServiceStatus.IN_PROGRESS }),
      );
    });

    it('debe lanzar ForbiddenException cuando otro profesional intenta iniciar el servicio', async () => {
      // Arrange
      const svc = {
        ...mockService,
        status: ServiceStatus.ACCEPTED,
        professionalId: 5,
      };
      mockFindServiceById.mockResolvedValue(svc);

      // Act & Assert
      await expect(service.startService('svc-001', 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar BadRequestException cuando el servicio no está ACCEPTED', async () => {
      // Arrange
      const svc = {
        ...mockService,
        status: ServiceStatus.PENDING,
        professionalId: 5,
      };
      mockFindServiceById.mockResolvedValue(svc);

      // Act & Assert
      await expect(service.startService('svc-001', 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeService', () => {
    it('debe completar el servicio cuando el profesional asignado lo solicita', async () => {
      // Arrange
      const svcInProgress = {
        ...mockService,
        status: ServiceStatus.IN_PROGRESS,
        professionalId: 5,
      };
      mockFindServiceById.mockResolvedValue(svcInProgress);
      mockUpdateService.mockResolvedValue({
        ...svcInProgress,
        status: ServiceStatus.COMPLETED,
      });

      // Act
      await service.completeService('svc-001', 5);

      // Assert
      expect(mockUpdateService).toHaveBeenCalledWith(
        'svc-001',
        expect.objectContaining({ status: ServiceStatus.COMPLETED }),
      );
    });

    it('debe lanzar ForbiddenException cuando otro profesional intenta completar el servicio', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.IN_PROGRESS,
        professionalId: 5,
      });

      // Act & Assert
      await expect(service.completeService('svc-001', 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar BadRequestException cuando el servicio no está IN_PROGRESS', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ACCEPTED,
        professionalId: 5,
      });

      // Act & Assert
      await expect(service.completeService('svc-001', 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createServiceRequest', () => {
    it('debe crear la solicitud de servicio cuando el profesional no ha enviado una antes', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue(mockService);
      mockFindDuplicateRequest.mockResolvedValue(null);
      mockCreateServiceRequest.mockResolvedValue({ id: 'req-001' });
      const dto = { proposedPrice: 50000, message: 'Puedo hacerlo' } as never;

      // Act
      const result = await service.createServiceRequest('svc-001', dto, 5);

      // Assert
      expect(mockCreateServiceRequest).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: 'svc-001', professionalId: 5 }),
      );
      expect(result).toBeDefined();
    });

    it('debe lanzar BadRequestException cuando el servicio no está en estado PENDING', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ACCEPTED,
      });

      // Act & Assert
      await expect(
        service.createServiceRequest('svc-001', {}, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException cuando el profesional ya envió una solicitud', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue(mockService);
      mockFindDuplicateRequest.mockResolvedValue({ id: 'req-existente' });

      // Act & Assert
      await expect(
        service.createServiceRequest('svc-001', {}, 5),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getServiceRequests', () => {
    it('debe retornar las solicitudes de un servicio', async () => {
      // Arrange
      const mockRequest = {
        id: 'req-001',
        serviceId: 'svc-001',
        professionalId: 5,
      };
      mockFindServiceRequests.mockResolvedValue([mockRequest]);

      // Act
      const result = await service.getServiceRequests('svc-001');

      // Assert
      expect(result.data).toHaveLength(1);
      expect(mockFindServiceRequests).toHaveBeenCalledWith('svc-001');
    });
  });

  describe('respondToServiceRequest', () => {
    const mockRequest = {
      id: 'req-001',
      serviceId: 'svc-001',
      professionalId: 5,
      status: RequestStatus.PENDING,
    };

    it('debe aceptar la solicitud y usar transacción', async () => {
      // Arrange
      const svc = { ...mockService, userId: 1 };
      mockFindServiceById.mockResolvedValue(svc);
      mockFindServiceRequest.mockResolvedValue(mockRequest);
      mockAcceptRequestTransaction.mockResolvedValue(undefined);
      mockFindServiceRequestById.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
      });
      const dto = { status: RequestStatus.ACCEPTED } as never;

      // Act
      const result = await service.respondToServiceRequest(
        'svc-001',
        'req-001',
        dto,
        1,
      );

      // Assert
      expect(mockAcceptRequestTransaction).toHaveBeenCalledWith(
        'req-001',
        'svc-001',
        5,
      );
      expect(result).toBeDefined();
    });

    it('debe rechazar la solicitud directamente (sin transacción)', async () => {
      // Arrange
      const svc = { ...mockService, userId: 1 };
      mockFindServiceById.mockResolvedValue(svc);
      mockFindServiceRequest.mockResolvedValue(mockRequest);
      mockUpdateServiceRequest.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.REJECTED,
      });
      const dto = { status: RequestStatus.REJECTED } as never;

      // Act
      await service.respondToServiceRequest('svc-001', 'req-001', dto, 1);

      // Assert
      expect(mockUpdateServiceRequest).toHaveBeenCalledWith(
        'req-001',
        expect.objectContaining({ status: RequestStatus.REJECTED }),
      );
    });

    it('debe lanzar ForbiddenException cuando quien responde no es el dueño del servicio', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue({ ...mockService, userId: 99 });

      // Act & Assert
      await expect(
        service.respondToServiceRequest('svc-001', 'req-001', {} as never, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar NotFoundException cuando la solicitud no existe', async () => {
      // Arrange
      mockFindServiceById.mockResolvedValue({ ...mockService, userId: 1 });
      mockFindServiceRequest.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.respondToServiceRequest(
          'svc-001',
          'req-no-existe',
          {} as never,
          1,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyServices', () => {
    it('debe retornar servicios del cliente cuando role=client', async () => {
      // Arrange
      mockFindMyServices.mockResolvedValue([mockService]);

      // Act
      const result = await service.getMyServices(1, undefined, 'client');

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindMyServices).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
      );
    });

    it('debe buscar el perfil profesional cuando role=professional', async () => {
      // Arrange
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockFindMyServices.mockResolvedValue([]);

      // Act
      await service.getMyServices(10, undefined, 'professional');

      // Assert
      expect(mockFindProfessionalByUserId).toHaveBeenCalledWith(10);
    });

    it('debe aplicar filtro de status cuando se provee', async () => {
      // Arrange
      mockFindMyServices.mockResolvedValue([]);

      // Act
      await service.getMyServices(1, ServiceStatus.COMPLETED, 'client');

      // Assert
      expect(mockFindMyServices).toHaveBeenCalledWith(
        expect.objectContaining({ status: ServiceStatus.COMPLETED }),
      );
    });
  });

  describe('getDashboardStats', () => {
    it('debe retornar estadísticas del dashboard para el usuario dado', async () => {
      // Arrange
      mockFindUserById.mockResolvedValue({ id: 1 });
      mockFindProfessionalByUserId.mockResolvedValue(null);
      mockCountServices
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1);

      // Act
      const result = await service.getDashboardStats(1);

      // Assert
      expect(result).toBeDefined();
      expect(mockFindUserById).toHaveBeenCalledWith(1);
    });

    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockFindUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getDashboardStats(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
