import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ServicesController } from './services.controller';
import { ServicesService } from '../services/services.service';
import {
  CreateServiceRequestDTO,
  UpdateServiceRequestDTO,
  CreateServiceRequestRequestDTO,
  RespondServiceRequestRequestDTO,
  GetServicesListQueryDTO,
  GetNearbyServicesQueryDTO,
  GetMyServicesQueryDTO,
} from '../dtos/request';

const mockCreateService = jest.fn();
const mockGetServices = jest.fn();
const mockGetNearbyServices = jest.fn();
const mockGetMyServices = jest.fn();
const mockGetDashboardStats = jest.fn();
const mockGetServiceById = jest.fn();
const mockUpdateService = jest.fn();
const mockCancelService = jest.fn();
const mockAcceptService = jest.fn();
const mockStartService = jest.fn();
const mockCompleteService = jest.fn();
const mockCreateServiceRequest = jest.fn();
const mockGetServiceRequests = jest.fn();
const mockRespondToServiceRequest = jest.fn();

const mockUser = { id: 1 } as unknown as IUserDataOnJwt;
const mockReq = { user: mockUser };
const mockServiceIdParam = { id: 'service-uuid-001' };
const mockServiceRequestParams = {
  id: 'service-uuid-001',
  requestId: 'request-uuid-001',
};

describe('ServicesController', () => {
  let controller: ServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: {
            createService: mockCreateService,
            getServices: mockGetServices,
            getNearbyServices: mockGetNearbyServices,
            getMyServices: mockGetMyServices,
            getDashboardStats: mockGetDashboardStats,
            getServiceById: mockGetServiceById,
            updateService: mockUpdateService,
            cancelService: mockCancelService,
            acceptService: mockAcceptService,
            startService: mockStartService,
            completeService: mockCompleteService,
            createServiceRequest: mockCreateServiceRequest,
            getServiceRequests: mockGetServiceRequests,
            respondToServiceRequest: mockRespondToServiceRequest,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createService', () => {
    it('debe crear el servicio pasando el userId del token', async () => {
      // Arrange
      const dto = {
        title: 'Reparación de cañerías',
      } as unknown as CreateServiceRequestDTO;
      const expected = {
        id: 'service-uuid-001',
        title: 'Reparación de cañerías',
        userId: 1,
      };
      mockCreateService.mockResolvedValue(expected);

      // Act
      const result = await controller.createService(dto, mockReq);

      // Assert
      expect(result).toEqual(expected);
      expect(mockCreateService).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('getServices', () => {
    it('debe retornar la lista paginada de servicios según los filtros', async () => {
      // Arrange
      const query = {
        page: 1,
        pageSize: 10,
      } as unknown as GetServicesListQueryDTO;
      const expected = {
        data: [{ id: 'uuid-1' }],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockGetServices.mockResolvedValue(expected);

      // Act
      const result = await controller.getServices(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetServices).toHaveBeenCalledWith(query);
    });
  });

  describe('getNearbyServices', () => {
    it('debe retornar servicios cercanos descomponiendo los campos del query', async () => {
      // Arrange
      const query = {
        latitude: -25.3,
        longitude: -57.6,
        radius: 5,
        categoryId: 2,
      } as unknown as GetNearbyServicesQueryDTO;
      const expected = [{ id: 'uuid-1', title: 'Plomería' }];
      mockGetNearbyServices.mockResolvedValue(expected);

      // Act
      const result = await controller.getNearbyServices(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetNearbyServices).toHaveBeenCalledWith(-25.3, -57.6, 5, 2);
    });
  });

  describe('getMyServices', () => {
    it('debe retornar los servicios del usuario autenticado con filtros de estado y rol', async () => {
      // Arrange
      const query = {
        status: 'PENDING',
        role: 'client',
      } as unknown as GetMyServicesQueryDTO;
      const expected = [{ id: 'uuid-1', userId: 1 }];
      mockGetMyServices.mockResolvedValue(expected);

      // Act
      const result = await controller.getMyServices(mockReq, query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetMyServices).toHaveBeenCalledWith(1, 'PENDING', 'client');
    });
  });

  describe('getDashboardStats', () => {
    it('debe retornar las estadísticas del dashboard para el usuario autenticado', async () => {
      // Arrange
      const expected = {
        total: 10,
        pending: 3,
        inProgress: 2,
        completed: 5,
        cancelled: 0,
        totalEarnings: 500,
      };
      mockGetDashboardStats.mockResolvedValue(expected);

      // Act
      const result = await controller.getDashboardStats(mockReq);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetDashboardStats).toHaveBeenCalledWith(1);
    });
  });

  describe('getServiceById', () => {
    it('debe retornar el detalle del servicio por su ID', async () => {
      // Arrange
      const expected = {
        id: 'service-uuid-001',
        title: 'Reparación eléctrica',
      };
      mockGetServiceById.mockResolvedValue(expected);

      // Act
      const result = await controller.getServiceById(mockServiceIdParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetServiceById).toHaveBeenCalledWith('service-uuid-001');
    });

    it('debe propagar NotFoundException si el servicio no existe', async () => {
      // Arrange
      mockGetServiceById.mockRejectedValue(
        new NotFoundException('Servicio no encontrado'),
      );

      // Act & Assert
      await expect(
        controller.getServiceById(mockServiceIdParam),
      ).rejects.toThrow('Servicio no encontrado');
    });
  });

  describe('updateService', () => {
    it('debe actualizar el servicio verificando el userId del token', async () => {
      // Arrange
      const dto = {
        title: 'Título actualizado',
      } as unknown as UpdateServiceRequestDTO;
      const expected = { id: 'service-uuid-001', title: 'Título actualizado' };
      mockUpdateService.mockResolvedValue(expected);

      // Act
      const result = await controller.updateService(
        mockServiceIdParam,
        dto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdateService).toHaveBeenCalledWith(
        'service-uuid-001',
        dto,
        1,
      );
    });

    it('debe propagar ForbiddenException si el usuario no tiene permisos', async () => {
      // Arrange
      mockUpdateService.mockRejectedValue(
        new ForbiddenException(
          'No tienes permisos para modificar este servicio',
        ),
      );

      // Act & Assert
      await expect(
        controller.updateService(mockServiceIdParam, {}, mockReq),
      ).rejects.toThrow('No tienes permisos para modificar este servicio');
    });
  });

  describe('cancelService', () => {
    it('debe cancelar el servicio extrayendo la razón del DTO', async () => {
      // Arrange
      const dto = { reason: 'El cliente canceló' };
      const expected = { id: 'service-uuid-001', status: 'CANCELLED' };
      mockCancelService.mockResolvedValue(expected);

      // Act
      const result = await controller.cancelService(
        mockServiceIdParam,
        dto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockCancelService).toHaveBeenCalledWith(
        'service-uuid-001',
        'El cliente canceló',
        1,
      );
    });

    it('debe propagar BadRequestException si el servicio no puede cancelarse en su estado actual', async () => {
      // Arrange
      mockCancelService.mockRejectedValue(
        new BadRequestException(
          'No se puede cancelar un servicio en este estado',
        ),
      );

      // Act & Assert
      await expect(
        controller.cancelService(
          mockServiceIdParam,
          { reason: 'motivo' },
          mockReq,
        ),
      ).rejects.toThrow('No se puede cancelar un servicio en este estado');
    });
  });

  describe('acceptService', () => {
    it('debe aceptar el servicio pasando el userId del profesional', async () => {
      // Arrange
      const expected = { id: 'service-uuid-001', status: 'ACCEPTED' };
      mockAcceptService.mockResolvedValue(expected);

      // Act
      const result = await controller.acceptService(
        mockServiceIdParam,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockAcceptService).toHaveBeenCalledWith('service-uuid-001', 1);
    });
  });

  describe('startService', () => {
    it('debe iniciar el servicio verificando que el profesional asignado sea quien lo inicia', async () => {
      // Arrange
      const expected = { id: 'service-uuid-001', status: 'IN_PROGRESS' };
      mockStartService.mockResolvedValue(expected);

      // Act
      const result = await controller.startService(mockServiceIdParam, mockReq);

      // Assert
      expect(result).toEqual(expected);
      expect(mockStartService).toHaveBeenCalledWith('service-uuid-001', 1);
    });
  });

  describe('completeService', () => {
    it('debe completar el servicio calculando el monto final basado en horas', async () => {
      // Arrange
      const expected = {
        id: 'service-uuid-001',
        status: 'COMPLETED',
        finalAmount: 150,
      };
      mockCompleteService.mockResolvedValue(expected);

      // Act
      const result = await controller.completeService(
        mockServiceIdParam,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockCompleteService).toHaveBeenCalledWith('service-uuid-001', 1);
    });
  });

  describe('createServiceRequest', () => {
    it('debe crear una solicitud de servicio para el profesional autenticado', async () => {
      // Arrange
      const dto = {
        proposedAmount: 200,
      } as unknown as CreateServiceRequestRequestDTO;
      const expected = {
        id: 'request-uuid-001',
        serviceId: 'service-uuid-001',
      };
      mockCreateServiceRequest.mockResolvedValue(expected);

      // Act
      const result = await controller.createServiceRequest(
        mockServiceIdParam,
        dto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockCreateServiceRequest).toHaveBeenCalledWith(
        'service-uuid-001',
        dto,
        1,
      );
    });
  });

  describe('getServiceRequests', () => {
    it('debe retornar las solicitudes del servicio indicado', async () => {
      // Arrange
      const expected = { data: [{ id: 'request-uuid-001' }] };
      mockGetServiceRequests.mockResolvedValue(expected);

      // Act
      const result = await controller.getServiceRequests(mockServiceIdParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetServiceRequests).toHaveBeenCalledWith('service-uuid-001');
    });
  });

  describe('respondToServiceRequest', () => {
    it('debe responder a una solicitud con el userId del cliente autenticado', async () => {
      // Arrange
      const dto = {
        status: 'ACCEPTED',
      } as unknown as RespondServiceRequestRequestDTO;
      const expected = { id: 'request-uuid-001', status: 'ACCEPTED' };
      mockRespondToServiceRequest.mockResolvedValue(expected);

      // Act
      const result = await controller.respondToServiceRequest(
        mockServiceRequestParams,
        dto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockRespondToServiceRequest).toHaveBeenCalledWith(
        'service-uuid-001',
        'request-uuid-001',
        dto,
        1,
      );
    });

    it('debe propagar ForbiddenException si no es el cliente quien responde', async () => {
      // Arrange
      mockRespondToServiceRequest.mockRejectedValue(
        new ForbiddenException(
          'Solo el cliente puede responder a las solicitudes',
        ),
      );

      // Act & Assert
      await expect(
        controller.respondToServiceRequest(
          mockServiceRequestParams,
          {} as RespondServiceRequestRequestDTO,
          mockReq,
        ),
      ).rejects.toThrow('Solo el cliente puede responder a las solicitudes');
    });
  });
});
