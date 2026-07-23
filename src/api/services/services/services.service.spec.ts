import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ServiceStatus, RequestStatus } from '@prisma/client';
import { ServicesService } from './services.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';

const mockFindCategoryById = jest.fn();
const mockCreateService = jest.fn();
const mockFindManyWithCount = jest.fn();
const mockFindNearby = jest.fn();
const mockFindServiceByReferenceId = jest.fn();
const mockUpdateServiceConditional = jest.fn();
const mockFindMyServices = jest.fn();
const mockFindProfessionalById = jest.fn();
const mockFindProfessionalByUserId = jest.fn();
const mockFindUserById = jest.fn();
const mockCountServices = jest.fn();
const mockAggregateEarnings = jest.fn();
const mockFindDuplicateRequest = jest.fn();
const mockCreateServiceRequest = jest.fn();
const mockFindServiceRequests = jest.fn();
const mockFindServiceRequestByReferenceId = jest.fn();
const mockFindServiceRequestById = jest.fn();
const mockUpdateServiceRequest = jest.fn();
const mockAcceptRequestTransaction = jest.fn();

// PK interna (Int) = 100; UUID público (referenceId) = 'svc-001' (el valor que viaja en la URL).
const SERVICE_REF = 'svc-001';
const SERVICE_PK = 100;

const mockService = {
  id: SERVICE_PK,
  referenceId: SERVICE_REF,
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
            findServiceByReferenceId: mockFindServiceByReferenceId,
            updateServiceConditional: mockUpdateServiceConditional,
            findMyServices: mockFindMyServices,
            findProfessionalById: mockFindProfessionalById,
            findProfessionalByUserId: mockFindProfessionalByUserId,
            findUserById: mockFindUserById,
            countServices: mockCountServices,
            aggregateEarnings: mockAggregateEarnings,
            findDuplicateRequest: mockFindDuplicateRequest,
            createServiceRequest: mockCreateServiceRequest,
            findServiceRequests: mockFindServiceRequests,
            findServiceRequestByReferenceId:
              mockFindServiceRequestByReferenceId,
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
    it('debe crear el servicio y exponer el referenceId como id cuando la categoría existe', async () => {
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
      expect(result.id).toBe(SERVICE_REF);
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
      expect(result.data[0].id).toBe(SERVICE_REF);
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
    it('debe resolver el servicio por su referenceId y exponerlo bajo la clave id', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(mockService);

      // Act
      const result = await service.getServiceById(SERVICE_REF);

      // Assert
      expect(result.id).toBe(SERVICE_REF);
      expect(mockFindServiceByReferenceId).toHaveBeenCalledWith(SERVICE_REF);
    });

    it('debe lanzar NotFoundException cuando el servicio no existe', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getServiceById('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateService', () => {
    it('debe actualizar el servicio (usando la PK interna) cuando el userId es el dueño y el estado es modificable', async () => {
      // Arrange
      const svcPending = {
        ...mockService,
        status: ServiceStatus.PENDING,
        userId: 1,
      };
      mockFindServiceByReferenceId.mockResolvedValue(svcPending);
      mockUpdateServiceConditional.mockResolvedValue(1);
      const dto = { title: 'Nuevo título' } as never;

      // Act
      const result = await service.updateService(SERVICE_REF, dto, 1);

      // Assert
      expect(mockUpdateServiceConditional).toHaveBeenCalledWith(
        SERVICE_PK,
        [ServiceStatus.PENDING, ServiceStatus.ACCEPTED],
        dto,
      );
      expect(result).toBeDefined();
    });

    it('debe lanzar ForbiddenException cuando el userId no es el dueño', async () => {
      // Arrange
      const svc = { ...mockService, userId: 99, professionalId: null };
      mockFindServiceByReferenceId.mockResolvedValue(svc);

      // Act & Assert
      await expect(service.updateService(SERVICE_REF, {}, 1)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUpdateServiceConditional).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando el estado no es modificable (COMPLETED)', async () => {
      // Arrange
      const svcCompleted = {
        ...mockService,
        status: ServiceStatus.COMPLETED,
        userId: 1,
      };
      mockFindServiceByReferenceId.mockResolvedValue(svcCompleted);

      // Act & Assert
      await expect(service.updateService(SERVICE_REF, {}, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar ConflictException cuando el estado cambió antes de poder actualizarlo', async () => {
      // Arrange
      const svcPending = {
        ...mockService,
        status: ServiceStatus.PENDING,
        userId: 1,
      };
      mockFindServiceByReferenceId.mockResolvedValue(svcPending);
      mockUpdateServiceConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(service.updateService(SERVICE_REF, {}, 1)).rejects.toThrow(
        ConflictException,
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
      mockFindServiceByReferenceId.mockResolvedValue(svc);
      mockUpdateServiceConditional.mockResolvedValue(1);

      // Act
      await service.cancelService(SERVICE_REF, 'Ya no lo necesito', 1);

      // Assert
      expect(mockUpdateServiceConditional).toHaveBeenCalledWith(
        SERVICE_PK,
        [ServiceStatus.PENDING, ServiceStatus.ACCEPTED],
        expect.objectContaining({ status: ServiceStatus.CANCELLED }),
      );
    });

    it('debe lanzar BadRequestException cuando el servicio ya está completado', async () => {
      // Arrange
      const svcCompleted = { ...mockService, status: ServiceStatus.COMPLETED };
      mockFindServiceByReferenceId.mockResolvedValue(svcCompleted);

      // Act & Assert
      await expect(
        service.cancelService(SERVICE_REF, 'razón', 1),
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
      mockFindServiceByReferenceId.mockResolvedValue(svc);
      mockFindProfessionalById.mockResolvedValue({ id: 5, userId: 88 });

      // Act & Assert
      await expect(
        service.cancelService(SERVICE_REF, 'razón', 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar ConflictException cuando el estado cambió antes de poder cancelarlo', async () => {
      // Arrange
      const svc = {
        ...mockService,
        status: ServiceStatus.PENDING,
        userId: 1,
        professionalId: null,
      };
      mockFindServiceByReferenceId.mockResolvedValue(svc);
      mockUpdateServiceConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.cancelService(SERVICE_REF, 'razón', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptService', () => {
    it('debe aceptar el servicio y asignar al profesional resuelto desde el userId', async () => {
      // Arrange
      const svcPending = { ...mockService, status: ServiceStatus.PENDING };
      mockFindServiceByReferenceId.mockResolvedValue(svcPending);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockUpdateServiceConditional.mockResolvedValue(1);

      // Act
      const result = await service.acceptService(SERVICE_REF, 10);

      // Assert
      expect(mockFindProfessionalByUserId).toHaveBeenCalledWith(10);
      expect(mockUpdateServiceConditional).toHaveBeenCalledWith(
        SERVICE_PK,
        [ServiceStatus.PENDING],
        expect.objectContaining({
          status: ServiceStatus.ACCEPTED,
          professionalId: 5,
        }),
      );
      expect(result).toBeDefined();
    });

    it('debe lanzar BadRequestException cuando el servicio no está en estado PENDING', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ACCEPTED,
      });

      // Act & Assert
      await expect(service.acceptService(SERVICE_REF, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar ForbiddenException cuando el usuario no tiene perfil profesional', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindProfessionalByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.acceptService(SERVICE_REF, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar ConflictException cuando otro profesional ya aceptó el servicio primero', async () => {
      // Arrange
      const svcPending = { ...mockService, status: ServiceStatus.PENDING };
      mockFindServiceByReferenceId.mockResolvedValue(svcPending);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockUpdateServiceConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(service.acceptService(SERVICE_REF, 10)).rejects.toThrow(
        ConflictException,
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
      mockFindServiceByReferenceId.mockResolvedValue(svcAccepted);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockUpdateServiceConditional.mockResolvedValue(1);

      // Act
      await service.startService(SERVICE_REF, 10);

      // Assert
      expect(mockUpdateServiceConditional).toHaveBeenCalledWith(
        SERVICE_PK,
        [ServiceStatus.ACCEPTED],
        expect.objectContaining({ status: ServiceStatus.IN_PROGRESS }),
      );
    });

    it('debe lanzar ConflictException cuando el estado cambió antes de poder iniciarlo', async () => {
      // Arrange
      const svcAccepted = {
        ...mockService,
        status: ServiceStatus.ACCEPTED,
        professionalId: 5,
      };
      mockFindServiceByReferenceId.mockResolvedValue(svcAccepted);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockUpdateServiceConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(service.startService(SERVICE_REF, 10)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ForbiddenException cuando otro profesional intenta iniciar el servicio', async () => {
      // Arrange
      const svc = {
        ...mockService,
        status: ServiceStatus.ACCEPTED,
        professionalId: 5,
      };
      mockFindServiceByReferenceId.mockResolvedValue(svc);
      mockFindProfessionalByUserId.mockResolvedValue({ id: 77, userId: 99 });

      // Act & Assert
      await expect(service.startService(SERVICE_REF, 99)).rejects.toThrow(
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
      mockFindServiceByReferenceId.mockResolvedValue(svc);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);

      // Act & Assert
      await expect(service.startService(SERVICE_REF, 10)).rejects.toThrow(
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
      mockFindServiceByReferenceId.mockResolvedValue(svcInProgress);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockUpdateServiceConditional.mockResolvedValue(1);

      // Act
      await service.completeService(SERVICE_REF, 10);

      // Assert
      expect(mockUpdateServiceConditional).toHaveBeenCalledWith(
        SERVICE_PK,
        [ServiceStatus.IN_PROGRESS],
        expect.objectContaining({ status: ServiceStatus.COMPLETED }),
      );
    });

    it('debe lanzar ConflictException cuando el estado cambió antes de poder completarlo', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.IN_PROGRESS,
        professionalId: 5,
      });
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockUpdateServiceConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(service.completeService(SERVICE_REF, 10)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ForbiddenException cuando otro profesional intenta completar el servicio', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.IN_PROGRESS,
        professionalId: 5,
      });
      mockFindProfessionalByUserId.mockResolvedValue({ id: 77, userId: 99 });

      // Act & Assert
      await expect(service.completeService(SERVICE_REF, 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar BadRequestException cuando el servicio no está IN_PROGRESS', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ACCEPTED,
        professionalId: 5,
      });
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);

      // Act & Assert
      await expect(service.completeService(SERVICE_REF, 10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createServiceRequest', () => {
    it('debe crear la solicitud de servicio (usando la PK interna del servicio) cuando el profesional no ha enviado una antes', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockFindDuplicateRequest.mockResolvedValue(null);
      mockCreateServiceRequest.mockResolvedValue({
        id: 200,
        referenceId: 'req-001',
        serviceId: SERVICE_PK,
        professionalId: 5,
        service: { referenceId: SERVICE_REF },
      });
      const dto = { proposedPrice: 50000, message: 'Puedo hacerlo' } as never;

      // Act
      const result = await service.createServiceRequest(SERVICE_REF, dto, 10);

      // Assert
      expect(mockCreateServiceRequest).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: SERVICE_PK, professionalId: 5 }),
      );
      expect(result.id).toBe('req-001');
      expect(result.serviceId).toBe(SERVICE_REF);
    });

    it('debe lanzar BadRequestException cuando el servicio no está en estado PENDING', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ACCEPTED,
      });

      // Act & Assert
      await expect(
        service.createServiceRequest(SERVICE_REF, {}, 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ForbiddenException cuando el usuario no tiene perfil profesional', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindProfessionalByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createServiceRequest(SERVICE_REF, {}, 999),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException cuando el profesional ya envió una solicitud', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindProfessionalByUserId.mockResolvedValue(mockProfessional);
      mockFindDuplicateRequest.mockResolvedValue({ id: 999 });

      // Act & Assert
      await expect(
        service.createServiceRequest(SERVICE_REF, {}, 10),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getServiceRequests', () => {
    it('debe retornar las solicitudes de un servicio resuelto por referenceId', async () => {
      // Arrange
      const mockRequest = {
        id: 200,
        referenceId: 'req-001',
        serviceId: SERVICE_PK,
        professionalId: 5,
        service: { referenceId: SERVICE_REF },
      };
      mockFindServiceByReferenceId.mockResolvedValue(mockService);
      mockFindServiceRequests.mockResolvedValue([mockRequest]);

      // Act
      const result = await service.getServiceRequests(SERVICE_REF);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('req-001');
      expect(result.data[0].serviceId).toBe(SERVICE_REF);
      expect(mockFindServiceRequests).toHaveBeenCalledWith(SERVICE_PK);
    });
  });

  describe('respondToServiceRequest', () => {
    const mockRequest = {
      id: 200,
      referenceId: 'req-001',
      serviceId: SERVICE_PK,
      professionalId: 5,
      status: RequestStatus.PENDING,
      service: { referenceId: SERVICE_REF },
    };

    it('debe aceptar la solicitud usando la transacción con las PK internas', async () => {
      // Arrange
      const svc = { ...mockService, userId: 1 };
      mockFindServiceByReferenceId.mockResolvedValue(svc);
      mockFindServiceRequestByReferenceId.mockResolvedValue(mockRequest);
      mockAcceptRequestTransaction.mockResolvedValue(1);
      mockFindServiceRequestById.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
      });
      const dto = { status: RequestStatus.ACCEPTED } as never;

      // Act
      const result = await service.respondToServiceRequest(
        SERVICE_REF,
        'req-001',
        dto,
        1,
      );

      // Assert
      expect(mockFindServiceRequestByReferenceId).toHaveBeenCalledWith(
        'req-001',
        SERVICE_PK,
      );
      expect(mockAcceptRequestTransaction).toHaveBeenCalledWith(
        200,
        SERVICE_PK,
        5,
      );
      expect(result.id).toBe('req-001');
    });

    it('debe lanzar ConflictException cuando el servicio ya no está disponible para aceptar la solicitud', async () => {
      // Arrange
      const svc = { ...mockService, userId: 1 };
      mockFindServiceByReferenceId.mockResolvedValue(svc);
      mockFindServiceRequestByReferenceId.mockResolvedValue(mockRequest);
      mockAcceptRequestTransaction.mockResolvedValue(0);
      const dto = { status: RequestStatus.ACCEPTED } as never;

      // Act & Assert
      await expect(
        service.respondToServiceRequest(SERVICE_REF, 'req-001', dto, 1),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar la solicitud directamente (sin transacción)', async () => {
      // Arrange
      const svc = { ...mockService, userId: 1 };
      mockFindServiceByReferenceId.mockResolvedValue(svc);
      mockFindServiceRequestByReferenceId.mockResolvedValue(mockRequest);
      mockUpdateServiceRequest.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.REJECTED,
      });
      const dto = { status: RequestStatus.REJECTED } as never;

      // Act
      await service.respondToServiceRequest(SERVICE_REF, 'req-001', dto, 1);

      // Assert
      expect(mockUpdateServiceRequest).toHaveBeenCalledWith(
        200,
        expect.objectContaining({ status: RequestStatus.REJECTED }),
      );
    });

    it('debe lanzar ForbiddenException cuando quien responde no es el dueño del servicio', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        ...mockService,
        userId: 99,
      });

      // Act & Assert
      await expect(
        service.respondToServiceRequest(SERVICE_REF, 'req-001', {} as never, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar NotFoundException cuando la solicitud no existe', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        ...mockService,
        userId: 1,
      });
      mockFindServiceRequestByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.respondToServiceRequest(
          SERVICE_REF,
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
