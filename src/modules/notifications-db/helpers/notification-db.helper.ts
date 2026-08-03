import { NotificationResponseDTO } from '@api/notifications/dtos/response/notification-response.dto';
import { NotificationDocument } from '../schemas/notification.schema';

export class NotificationDbHelper {
  // El controller nunca debe devolver un NotificationDocument crudo de Mongoose — el
  // ClassSerializerInterceptor global usa class-transformer (instanceToPlain), que ignora el
  // toJSON() custom de Mongoose y serializa las propiedades internas del documento ($__, _doc,
  // $isNew) en vez de los campos reales. Mapear siempre a un objeto plano con esta forma.
  static mapToResponse(doc: NotificationDocument): NotificationResponseDTO {
    return {
      id: doc._id.toString(),
      userId: String(doc.userId),
      title: doc.title,
      message: doc.message,
      type: doc.type,
      status: doc.status,
      channels: doc.channels,
      data: doc.data,
      readAt: doc.readAt ?? null,
      sentAt: doc.sentAt ?? null,
      createdAt: doc.createdAt,
    };
  }

  static mapManyToResponse(
    docs: NotificationDocument[],
  ): NotificationResponseDTO[] {
    return docs.map((doc) => NotificationDbHelper.mapToResponse(doc));
  }
}
