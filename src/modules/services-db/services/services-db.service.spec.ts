import { Test, TestingModule } from '@nestjs/testing';
import { ServiceStatus, RequestStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ServicesDbService } from './services-db.service';

const serviceRefInclude = { service: { select: { referenceId: true } } };

// ─── Mocks de category ────────────────────────────────────────────────────────
const mockCategoryFindUnique = jest.fn();

// ─── Mocks de services ────────────────────────────────────────────────────────
const mockServicesFindMany = jest.fn();
const mockServicesFindUnique = jest.fn();
const mockServicesCreate = jest.fn();
const mockServicesUpdate = jest.fn();
const mockServicesUpdateMany = jest.fn();
const mockServicesCount = jest.fn();
const mockServicesAggregate = jest.fn();

// ─── Mocks de professionals ───────────────────────────────────────────────────
const mockProfessionalsFindUnique = jest.fn();

// ─── Mocks de users ───────────────────────────────────────────────────────────
const mockUsersFindUnique = jest.fn();

// ─── Mocks de serviceRequests ─────────────────────────────────────────────────
const mockServiceRequestsFindFirst = jest.fn();
const mockServiceRequestsFindMany = jest.fn();
const mockServiceRequestsFindUnique = jest.fn();
const mockServiceRequestsCreate = jest.fn();
const mockServiceRequestsUpdate = jest.fn();
const mockServiceRequestsUpdateMany = jest.fn();

// ─── Mock de $transaction ─────────────────────────────────────────────────────
const mockTransaction = jest.fn();

const mockPrisma = {
  extended: {
    category: {
      findUnique: mockCategoryFindUnique,
    },
    services: {
      findMany: mockServicesFindMany,
      findUnique: mockServicesFindUnique,
      create: mockServicesCreate,
      update: mockServicesUpdate,
      updateMany: mockServicesUpdateMany,
      count: mockServicesCount,
      aggregate: mockServicesAggregate,
    },
    professionals: {
      findUnique: mockProfessionalsFindUnique,
    },
    users: {
      findUnique: mockUsersFindUnique,
    },
    serviceRequests: {
      findFirst: mockServiceRequestsFindFirst,
      findMany: mockServiceRequestsFindMany,
      findUnique: mockServiceRequestsFindUnique,
      create: mockServiceRequestsCreate,
      update: mockServiceRequestsUpdate,
      updateMany: mockServiceRequestsUpdateMany,
    },
    $transaction: mockTransaction,
  },
};

describe('ServicesDbService', () => {
  let service: ServicesDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ServicesDbService>(ServicesDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findCategoryById ────────────────────────────────────────────────────
  describe('findCategoryById', () => {
    it('debe retornar la categoría cuando existe el id', async () => {
      // Arrange
      const category = { id: 1, name: 'Plomería' };
      mockCategoryFindUnique.mockResolvedValue(category);

      // Act
      const result = await service.findCategoryById(1);

      // Assert
      expect(result).toEqual(category);
      expect(mockCategoryFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('debe retornar null cuando la categoría no existe', async () => {
      // Arrange
      mockCategoryFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findCategoryById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── createService ───────────────────────────────────────────────────────
  describe('createService', () => {
    it('debe retornar el servicio creado con los datos provistos', async () => {
      // Arrange
      const data = { title: 'Reparación de cañería', userId: 1, categoryId: 2 };
      const created = { id: 1, referenceId: 'svc-uuid-1', ...data };
      mockServicesCreate.mockResolvedValue(created);

      // Act
      const result = await service.createService(data as never);

      // Assert
      expect(result).toEqual(created);
      expect(mockServicesCreate).toHaveBeenCalledWith({ data });
    });
  });

  // ─── findManyWithCount ───────────────────────────────────────────────────
  describe('findManyWithCount', () => {
    it('debe retornar el arreglo de servicios y el total de registros en paralelo', async () => {
      // Arrange
      const services = [{ id: 1 }, { id: 2 }];
      const total = 20;
      mockServicesFindMany.mockResolvedValue(services);
      mockServicesCount.mockResolvedValue(total);

      // Act
      const result = await service.findManyWithCount({}, 2, 10);

      // Assert
      expect(result).toEqual([services, total]);
      expect(mockServicesFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(mockServicesCount).toHaveBeenCalledWith({ where: {} });
    });

    it('debe calcular correctamente el offset de paginación para la página indicada', async () => {
      // Arrange
      mockServicesFindMany.mockResolvedValue([]);
      mockServicesCount.mockResolvedValue(0);

      // Act
      await service.findManyWithCount({}, 3, 5);

      // Assert
      expect(mockServicesFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });

  // ─── findNearby ──────────────────────────────────────────────────────────
  describe('findNearby', () => {
    it('debe retornar hasta 50 servicios cercanos con el filtro aplicado', async () => {
      // Arrange
      const services = [{ id: 1 }];
      mockServicesFindMany.mockResolvedValue(services);

      // Act
      const result = await service.findNearby({ categoryId: 1 });

      // Assert
      expect(result).toEqual(services);
      expect(mockServicesFindMany).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        include: { users: true, category: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  // ─── findServiceById ─────────────────────────────────────────────────────
  describe('findServiceById', () => {
    it('debe retornar el servicio con todas sus relaciones cuando existe la PK interna', async () => {
      // Arrange
      const svc = { id: 1, referenceId: 'svc-uuid-1', title: 'Pintura' };
      mockServicesFindUnique.mockResolvedValue(svc);

      // Act
      const result = await service.findServiceById(1);

      // Assert
      expect(result).toEqual(svc);
      expect(mockServicesFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          users: true,
          professional: true,
          category: true,
          requests: true,
        },
      });
    });

    it('debe retornar null cuando el servicio no existe', async () => {
      // Arrange
      mockServicesFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findServiceById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── findServiceByReferenceId ────────────────────────────────────────────
  describe('findServiceByReferenceId', () => {
    it('debe buscar el servicio por su referenceId (UUID público) con sus relaciones', async () => {
      // Arrange
      const svc = { id: 1, referenceId: 'svc-uuid-1', title: 'Pintura' };
      mockServicesFindUnique.mockResolvedValue(svc);

      // Act
      const result = await service.findServiceByReferenceId('svc-uuid-1');

      // Assert
      expect(result).toEqual(svc);
      expect(mockServicesFindUnique).toHaveBeenCalledWith({
        where: { referenceId: 'svc-uuid-1' },
        include: {
          users: true,
          professional: true,
          category: true,
          requests: true,
        },
      });
    });
  });

  // ─── updateService ───────────────────────────────────────────────────────
  describe('updateService', () => {
    it('debe retornar el servicio actualizado con los datos provistos', async () => {
      // Arrange
      const updated = {
        id: 1,
        referenceId: 'svc-uuid-1',
        title: 'Nuevo título',
      };
      mockServicesUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updateService(1, {
        title: 'Nuevo título',
      });

      // Assert
      expect(result).toEqual(updated);
      expect(mockServicesUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Nuevo título' },
      });
    });
  });

  // ─── findMyServices ──────────────────────────────────────────────────────
  describe('findMyServices', () => {
    it('debe retornar los servicios del usuario con el filtro aplicado', async () => {
      // Arrange
      const services = [{ id: 1, userId: 5 }];
      mockServicesFindMany.mockResolvedValue(services);

      // Act
      const result = await service.findMyServices({ userId: 5 });

      // Assert
      expect(result).toEqual(services);
      expect(mockServicesFindMany).toHaveBeenCalledWith({
        where: { userId: 5 },
        include: {
          users: true,
          professional: { include: { user: true } },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findProfessionalById ────────────────────────────────────────────────
  describe('findProfessionalById', () => {
    it('debe retornar el profesional cuando existe el id', async () => {
      // Arrange
      const professional = { id: 3, userId: 10 };
      mockProfessionalsFindUnique.mockResolvedValue(professional);

      // Act
      const result = await service.findProfessionalById(3);

      // Assert
      expect(result).toEqual(professional);
      expect(mockProfessionalsFindUnique).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });
  });

  // ─── findProfessionalByUserId ────────────────────────────────────────────
  describe('findProfessionalByUserId', () => {
    it('debe retornar el profesional vinculado al userId dado', async () => {
      // Arrange
      const professional = { id: 3, userId: 10 };
      mockProfessionalsFindUnique.mockResolvedValue(professional);

      // Act
      const result = await service.findProfessionalByUserId(10);

      // Assert
      expect(result).toEqual(professional);
      expect(mockProfessionalsFindUnique).toHaveBeenCalledWith({
        where: { userId: 10 },
      });
    });

    it('debe retornar null cuando el usuario no tiene perfil profesional', async () => {
      // Arrange
      mockProfessionalsFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findProfessionalByUserId(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── findUserById ────────────────────────────────────────────────────────
  describe('findUserById', () => {
    it('debe retornar el usuario cuando existe el id', async () => {
      // Arrange
      const user = { id: 1, email: 'test@example.com' };
      mockUsersFindUnique.mockResolvedValue(user);

      // Act
      const result = await service.findUserById(1);

      // Assert
      expect(result).toEqual(user);
      expect(mockUsersFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ─── countServices ───────────────────────────────────────────────────────
  describe('countServices', () => {
    it('debe retornar la cantidad de servicios que cumplen el filtro', async () => {
      // Arrange
      mockServicesCount.mockResolvedValue(12);

      // Act
      const result = await service.countServices({
        status: ServiceStatus.COMPLETED,
      });

      // Assert
      expect(result).toBe(12);
      expect(mockServicesCount).toHaveBeenCalledWith({
        where: { status: ServiceStatus.COMPLETED },
      });
    });
  });

  // ─── aggregateEarnings ───────────────────────────────────────────────────
  describe('aggregateEarnings', () => {
    it('debe retornar la suma de ganancias del profesional en servicios completados', async () => {
      // Arrange
      const agg = { _sum: { finalAmount: 50000 } };
      mockServicesAggregate.mockResolvedValue(agg);

      // Act
      const result = await service.aggregateEarnings(4);

      // Assert
      expect(result).toEqual(agg);
      expect(mockServicesAggregate).toHaveBeenCalledWith({
        where: { professionalId: 4, status: ServiceStatus.COMPLETED },
        _sum: { finalAmount: true },
      });
    });
  });

  // ─── findDuplicateRequest ────────────────────────────────────────────────
  describe('findDuplicateRequest', () => {
    it('debe retornar la solicitud existente cuando ya fue creada para ese servicio y profesional', async () => {
      // Arrange
      const req = { id: 1, serviceId: 1, professionalId: 2 };
      mockServiceRequestsFindFirst.mockResolvedValue(req);

      // Act
      const result = await service.findDuplicateRequest(1, 2);

      // Assert
      expect(result).toEqual(req);
      expect(mockServiceRequestsFindFirst).toHaveBeenCalledWith({
        where: { serviceId: 1, professionalId: 2 },
      });
    });

    it('debe retornar null cuando no existe solicitud duplicada', async () => {
      // Arrange
      mockServiceRequestsFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findDuplicateRequest(77, 99);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── createServiceRequest ────────────────────────────────────────────────
  describe('createServiceRequest', () => {
    it('debe retornar la solicitud de servicio creada incluyendo el referenceId del servicio', async () => {
      // Arrange
      const data = { serviceId: 1, professionalId: 2 };
      const created = {
        id: 1,
        referenceId: 'req-uuid-1',
        ...data,
        service: { referenceId: 'svc-uuid-1' },
      };
      mockServiceRequestsCreate.mockResolvedValue(created);

      // Act
      const result = await service.createServiceRequest(data);

      // Assert
      expect(result).toEqual(created);
      expect(mockServiceRequestsCreate).toHaveBeenCalledWith({
        data,
        include: serviceRefInclude,
      });
    });
  });

  // ─── findServiceRequests ─────────────────────────────────────────────────
  describe('findServiceRequests', () => {
    it('debe retornar todas las solicitudes de un servicio con el profesional y el referenceId del servicio', async () => {
      // Arrange
      const requests = [{ id: 1, serviceId: 1 }];
      mockServiceRequestsFindMany.mockResolvedValue(requests);

      // Act
      const result = await service.findServiceRequests(1);

      // Assert
      expect(result).toEqual(requests);
      expect(mockServiceRequestsFindMany).toHaveBeenCalledWith({
        where: { serviceId: 1 },
        include: { professional: true, ...serviceRefInclude },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findServiceRequestByReferenceId ─────────────────────────────────────
  describe('findServiceRequestByReferenceId', () => {
    it('debe retornar la solicitud que coincida con el referenceId dentro del servicio dado', async () => {
      // Arrange
      const req = { id: 1, referenceId: 'req-uuid-1', serviceId: 1 };
      mockServiceRequestsFindFirst.mockResolvedValue(req);

      // Act
      const result = await service.findServiceRequestByReferenceId(
        'req-uuid-1',
        1,
      );

      // Assert
      expect(result).toEqual(req);
      expect(mockServiceRequestsFindFirst).toHaveBeenCalledWith({
        where: { referenceId: 'req-uuid-1', serviceId: 1 },
      });
    });
  });

  // ─── findServiceRequestById ──────────────────────────────────────────────
  describe('findServiceRequestById', () => {
    it('debe retornar la solicitud cuando existe la PK interna', async () => {
      // Arrange
      const req = { id: 1, status: RequestStatus.PENDING };
      mockServiceRequestsFindUnique.mockResolvedValue(req);

      // Act
      const result = await service.findServiceRequestById(1);

      // Assert
      expect(result).toEqual(req);
      expect(mockServiceRequestsFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: serviceRefInclude,
      });
    });
  });

  // ─── updateServiceRequest ────────────────────────────────────────────────
  describe('updateServiceRequest', () => {
    it('debe retornar la solicitud actualizada con el nuevo estado', async () => {
      // Arrange
      const updated = { id: 1, status: RequestStatus.ACCEPTED };
      mockServiceRequestsUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updateServiceRequest(1, {
        status: RequestStatus.ACCEPTED,
      });

      // Assert
      expect(result).toEqual(updated);
      expect(mockServiceRequestsUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: RequestStatus.ACCEPTED },
        include: serviceRefInclude,
      });
    });
  });

  // ─── acceptRequestTransaction ────────────────────────────────────────────
  describe('acceptRequestTransaction', () => {
    it('debe aceptar la solicitud y rechazar las demás cuando el servicio sigue PENDING', async () => {
      // Arrange
      const mockServicesUpdateManyTx = jest
        .fn()
        .mockResolvedValue({ count: 1 });
      const mockServiceRequestsUpdateTx = jest.fn().mockResolvedValue({
        id: 1,
        status: RequestStatus.ACCEPTED,
      });
      const mockServiceRequestsUpdateManyTx = jest
        .fn()
        .mockResolvedValue({ count: 2 });
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            services: { updateMany: mockServicesUpdateManyTx },
            serviceRequests: {
              update: mockServiceRequestsUpdateTx,
              updateMany: mockServiceRequestsUpdateManyTx,
            },
          };
          return callback(txClient);
        },
      );

      // Act
      const result = await service.acceptRequestTransaction(1, 10, 5);

      // Assert
      expect(result).toBe(1);
      expect(mockServicesUpdateManyTx).toHaveBeenCalledWith({
        where: { id: 10, status: ServiceStatus.PENDING },
        data: { status: ServiceStatus.ACCEPTED, professionalId: 5 },
      });
      expect(mockServiceRequestsUpdateTx).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: RequestStatus.ACCEPTED },
      });
      expect(mockServiceRequestsUpdateManyTx).toHaveBeenCalledWith({
        where: {
          serviceId: 10,
          status: RequestStatus.PENDING,
          id: { not: 1 },
        },
        data: { status: RequestStatus.REJECTED },
      });
    });

    it('debe devolver 0 sin tocar las solicitudes cuando el servicio ya no está PENDING', async () => {
      // Arrange
      const mockServicesUpdateManyTx = jest
        .fn()
        .mockResolvedValue({ count: 0 });
      const mockServiceRequestsUpdateTx = jest.fn();
      const mockServiceRequestsUpdateManyTx = jest.fn();
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            services: { updateMany: mockServicesUpdateManyTx },
            serviceRequests: {
              update: mockServiceRequestsUpdateTx,
              updateMany: mockServiceRequestsUpdateManyTx,
            },
          };
          return callback(txClient);
        },
      );

      // Act
      const result = await service.acceptRequestTransaction(1, 10, 5);

      // Assert
      expect(result).toBe(0);
      expect(mockServiceRequestsUpdateTx).not.toHaveBeenCalled();
      expect(mockServiceRequestsUpdateManyTx).not.toHaveBeenCalled();
    });
  });

  // ─── updateServiceConditional ────────────────────────────────────────────
  describe('updateServiceConditional', () => {
    it('debe actualizar y devolver 1 cuando el estado actual coincide con uno de los esperados', async () => {
      // Arrange
      mockServicesUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      const result = await service.updateServiceConditional(
        1,
        [ServiceStatus.PENDING],
        { status: ServiceStatus.ACCEPTED },
      );

      // Assert
      expect(result).toBe(1);
      expect(mockServicesUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, status: { in: [ServiceStatus.PENDING] } },
        data: { status: ServiceStatus.ACCEPTED },
      });
    });

    it('debe devolver 0 cuando el estado actual ya no coincide (carrera con otro proceso)', async () => {
      // Arrange
      mockServicesUpdateMany.mockResolvedValue({ count: 0 });

      // Act
      const result = await service.updateServiceConditional(
        1,
        [ServiceStatus.PENDING],
        { status: ServiceStatus.ACCEPTED },
      );

      // Assert
      expect(result).toBe(0);
    });
  });
});
