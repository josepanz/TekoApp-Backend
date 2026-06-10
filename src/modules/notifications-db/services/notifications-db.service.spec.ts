import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationDocument } from '../schemas/notification.schema';
import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationsDbService } from './notifications-db.service';

// ── Mocks a nivel de módulo ────────────────────────────────────────────────
const mockSave = jest.fn();
const mockInsertMany = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockUpdateMany = jest.fn();
const mockDeleteOne = jest.fn();
const mockFindByIdAndUpdate = jest.fn();

// Encadena los métodos fluidos de Mongoose
const buildChain = (finalFn: jest.Mock) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: finalFn,
});

// Constructor-mock para `new this.model(data).save()`
function MockModel(this: unknown, data: unknown) {
  Object.assign(this as object, data);
  (this as { save: jest.Mock }).save = mockSave;
}
MockModel.insertMany = mockInsertMany;
MockModel.find = jest.fn();
MockModel.countDocuments = jest.fn();
MockModel.findOneAndUpdate = jest.fn();
MockModel.updateMany = jest.fn();
MockModel.deleteOne = jest.fn();
MockModel.findByIdAndUpdate = jest.fn();

// ── Fixtures ───────────────────────────────────────────────────────────────
const userId = 'user-abc-123';
const notifId = 'notif-xyz-456';

const baseNotification = {
  _id: notifId,
  userId,
  title: 'Prueba',
  message: 'Mensaje de prueba',
  status: NotificationStatus.PENDING,
  channels: ['in_app'],
} as unknown as NotificationDocument;

describe('NotificationsDbService', () => {
  let service: NotificationsDbService;

  beforeEach(async () => {
    // Reseteamos los spies del modelo antes de cada test
    MockModel.find.mockReturnValue(buildChain(mockFind));
    MockModel.countDocuments.mockReturnValue({
      exec: mockCountDocuments,
    });
    MockModel.findOneAndUpdate.mockReturnValue({
      exec: mockFindOneAndUpdate,
    });
    MockModel.updateMany.mockReturnValue({
      exec: mockUpdateMany,
    });
    MockModel.deleteOne.mockReturnValue({ exec: mockDeleteOne });
    MockModel.findByIdAndUpdate.mockReturnValue({
      exec: mockFindByIdAndUpdate,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsDbService,
        {
          provide: getModelToken(NotificationDocument.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    service = module.get<NotificationsDbService>(NotificationsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('debe persistir y retornar el documento creado', async () => {
      // Arrange
      mockSave.mockResolvedValue(baseNotification);

      // Act
      const result = await service.create({
        userId,
        title: 'Prueba',
        message: 'Mensaje de prueba',
      } as unknown as Partial<NotificationDocument>);

      // Assert
      expect(result).toEqual(baseNotification);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  // ── insertMany ─────────────────────────────────────────────────────────
  describe('insertMany', () => {
    it('debe insertar múltiples notificaciones y retornar los documentos creados', async () => {
      // Arrange
      const docs = [baseNotification, { ...baseNotification, _id: 'other-id' }];
      mockInsertMany.mockResolvedValue(docs);
      const input = [
        { userId, title: 'Notif 1', message: 'Msg 1' },
        { userId, title: 'Notif 2', message: 'Msg 2' },
      ] as unknown as Partial<NotificationDocument>[];

      // Act
      const result = await service.insertMany(input);

      // Assert
      expect(result).toEqual(docs);
      expect(mockInsertMany).toHaveBeenCalledWith(input);
    });
  });

  // ── findByUserId ───────────────────────────────────────────────────────
  describe('findByUserId', () => {
    it('debe retornar las notificaciones del usuario paginadas', async () => {
      // Arrange
      mockFind.mockResolvedValue([baseNotification]);

      // Act
      const result = await service.findByUserId(userId, 10, 0);

      // Assert
      expect(result).toEqual([baseNotification]);
      expect(MockModel.find).toHaveBeenCalledWith({ userId });
    });

    it('debe retornar lista vacía cuando el usuario no tiene notificaciones', async () => {
      // Arrange
      mockFind.mockResolvedValue([]);

      // Act
      const result = await service.findByUserId('otro-usuario', 10, 0);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── findUnreadByUserId ─────────────────────────────────────────────────
  describe('findUnreadByUserId', () => {
    it('debe retornar solo las notificaciones no leídas del usuario', async () => {
      // Arrange
      mockFind.mockResolvedValue([baseNotification]);

      // Act
      const result = await service.findUnreadByUserId(userId);

      // Assert
      expect(result).toEqual([baseNotification]);
      expect(MockModel.find).toHaveBeenCalledWith({
        userId,
        status: { $ne: NotificationStatus.READ },
      });
    });
  });

  // ── countUnreadByUserId ────────────────────────────────────────────────
  describe('countUnreadByUserId', () => {
    it('debe retornar la cantidad de notificaciones no leídas del usuario', async () => {
      // Arrange
      mockCountDocuments.mockResolvedValue(3);

      // Act
      const result = await service.countUnreadByUserId(userId);

      // Assert
      expect(result).toBe(3);
      expect(MockModel.countDocuments).toHaveBeenCalledWith({
        userId,
        status: { $ne: NotificationStatus.READ },
      });
    });

    it('debe retornar 0 cuando el usuario no tiene notificaciones sin leer', async () => {
      // Arrange
      mockCountDocuments.mockResolvedValue(0);

      // Act
      const result = await service.countUnreadByUserId(userId);

      // Assert
      expect(result).toBe(0);
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('debe retornar el documento actualizado con el nuevo estado', async () => {
      // Arrange
      const updated = { ...baseNotification, status: NotificationStatus.READ };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updateStatus(notifId, userId, {
        status: NotificationStatus.READ,
      });

      // Assert
      expect(result).toEqual(updated);
      expect(MockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: notifId, userId },
        { status: NotificationStatus.READ },
        { new: true },
      );
    });

    it('debe retornar null cuando la notificación no pertenece al usuario', async () => {
      // Arrange
      mockFindOneAndUpdate.mockResolvedValue(null);

      // Act
      const result = await service.updateStatus(notifId, 'otro-usuario', {
        status: NotificationStatus.READ,
      });

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── markAllAsRead ──────────────────────────────────────────────────────
  describe('markAllAsRead', () => {
    it('debe marcar todas las notificaciones no leídas del usuario como leídas', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ modifiedCount: 2 });

      // Act
      await service.markAllAsRead(userId);

      // Assert
      expect(MockModel.updateMany).toHaveBeenCalledWith(
        { userId, status: { $ne: NotificationStatus.READ } },
        expect.objectContaining({ status: NotificationStatus.READ }),
      );
    });
  });

  // ── deleteOne ──────────────────────────────────────────────────────────
  describe('deleteOne', () => {
    it('debe eliminar la notificación que pertenece al usuario', async () => {
      // Arrange
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });

      // Act
      await service.deleteOne(notifId, userId);

      // Assert
      expect(MockModel.deleteOne).toHaveBeenCalledWith({
        _id: notifId,
        userId,
      });
    });
  });

  // ── updateStatusByIdDirectly ───────────────────────────────────────────
  describe('updateStatusByIdDirectly', () => {
    it('debe actualizar el documento por id sin verificar usuario', async () => {
      // Arrange
      mockFindByIdAndUpdate.mockResolvedValue(baseNotification);
      const updateData = {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      };

      // Act
      await service.updateStatusByIdDirectly(notifId, updateData);

      // Assert
      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        notifId,
        updateData,
      );
    });
  });
});
