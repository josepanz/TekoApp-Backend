import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from '@api/notifications/services/notifications.service';

// ── mocks de nivel de módulo ─────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockFindUnread = jest.fn();
const mockGetUnreadCount = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockDelete = jest.fn();

// ── helper: request con usuario autenticado ───────────────────────────────────
const makeReq = (id: number | string = 42) =>
  ({ user: { id, referenceId: 'ref-001' } }) as unknown as {
    user: import('@modules/auth/interfaces/user-data-on-jwt.interface').IUserDataOnJwt;
  };

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            create: mockCreate,
            findAll: mockFindAll,
            findUnread: mockFindUnread,
            getUnreadCount: mockGetUnreadCount,
            markAsRead: mockMarkAsRead,
            markAllAsRead: mockMarkAllAsRead,
            delete: mockDelete,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('debe crear y encolar una notificación para el usuario autenticado', async () => {
      // Arrange
      const dto = { title: 'Nuevo mensaje', type: 'in_app' } as never;
      const req = makeReq(42);
      const expected = { _id: 'abc123', title: 'Nuevo mensaje' };
      mockCreate.mockResolvedValue(expected);

      // Act
      const result = await controller.create(dto, req);

      // Assert
      expect(result).toEqual(expected);
      expect(mockCreate).toHaveBeenCalledWith(dto, '42');
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('debe retornar el historial paginado de notificaciones del usuario', async () => {
      // Arrange
      const req = makeReq(42);
      const query = { limit: 10, offset: 0 } as never;
      const expected = [{ _id: 'abc', title: 'Test' }];
      mockFindAll.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll(req, query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindAll).toHaveBeenCalledWith('42', 10, 0);
    });

    it('debe retornar arreglo vacío cuando el usuario no tiene notificaciones', async () => {
      // Arrange
      const req = makeReq(42);
      const query = { limit: 10, offset: 0 } as never;
      mockFindAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll(req, query);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── findUnread ────────────────────────────────────────────────────────────
  describe('findUnread', () => {
    it('debe retornar únicamente las notificaciones no leídas del usuario', async () => {
      // Arrange
      const req = makeReq(42);
      const expected = [{ _id: 'xyz', status: 'PENDING' }];
      mockFindUnread.mockResolvedValue(expected);

      // Act
      const result = await controller.findUnread(req);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindUnread).toHaveBeenCalledWith('42');
    });
  });

  // ── getUnreadCount ────────────────────────────────────────────────────────
  describe('getUnreadCount', () => {
    it('debe retornar el contador de notificaciones no leídas del usuario', async () => {
      // Arrange
      const req = makeReq(42);
      mockGetUnreadCount.mockResolvedValue(7);

      // Act
      const result = await controller.getUnreadCount(req);

      // Assert
      expect(result).toEqual({ count: 7 });
      expect(mockGetUnreadCount).toHaveBeenCalledWith('42');
    });

    it('debe retornar count 0 cuando el usuario no tiene notificaciones pendientes', async () => {
      // Arrange
      const req = makeReq(42);
      mockGetUnreadCount.mockResolvedValue(0);

      // Act
      const result = await controller.getUnreadCount(req);

      // Assert
      expect(result).toEqual({ count: 0 });
    });
  });

  // ── markAsRead ────────────────────────────────────────────────────────────
  describe('markAsRead', () => {
    it('debe marcar la notificación indicada como leída y retornarla actualizada', async () => {
      // Arrange
      const param = { id: 'notif-001' } as never;
      const req = makeReq(42);
      const expected = { _id: 'notif-001', status: 'READ' };
      mockMarkAsRead.mockResolvedValue(expected);

      // Act
      const result = await controller.markAsRead(param, req);

      // Assert
      expect(result).toEqual(expected);
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-001', '42');
    });

    it('debe propagar NotFoundException cuando la notificación no pertenece al usuario', async () => {
      // Arrange
      const param = { id: 'notif-999' } as never;
      const req = makeReq(42);
      mockMarkAsRead.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.markAsRead(param, req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── markAllAsRead ─────────────────────────────────────────────────────────
  describe('markAllAsRead', () => {
    it('debe marcar todas las notificaciones del usuario como leídas (204)', async () => {
      // Arrange
      const req = makeReq(42);
      mockMarkAllAsRead.mockResolvedValue(undefined);

      // Act
      await controller.markAllAsRead(req);

      // Assert
      expect(mockMarkAllAsRead).toHaveBeenCalledWith('42');
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('debe eliminar la notificación del historial del usuario (204)', async () => {
      // Arrange
      const param = { id: 'notif-001' } as never;
      const req = makeReq(42);
      mockDelete.mockResolvedValue(undefined);

      // Act
      await controller.remove(param, req);

      // Assert
      expect(mockDelete).toHaveBeenCalledWith('notif-001', '42');
    });

    it('debe propagar NotFoundException cuando la notificación no existe', async () => {
      // Arrange
      const param = { id: 'notif-999' } as never;
      const req = makeReq(42);
      mockDelete.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.remove(param, req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
