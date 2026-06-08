import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsAuthGuard } from '../guards/ws-auth.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  },
  namespace: '/locations',
})
@UseGuards(WsAuthGuard)
export class WebSocketConfig
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebSocketConfig.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Cliente conectado: ${client.id}`);
    void client.join('general');

    client.emit('connected', {
      message: 'Conectado al servidor de TekoApp',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliente desconectado: ${client.id}`);

    // EXPLICACIÓN DEL FIX: leaveAll es privado en Socket.io v4+.
    // Los sockets salen automáticamente de sus salas al desconectarse.
    // Si necesitas purgar manualmente de forma segura antes de que se destruya la instancia:
    for (const room of client.rooms) {
      if (room !== client.id) {
        void client.leave(room);
      }
    }
  }

  @SubscribeMessage('subscribeLocation')
  handleSubscribeLocation(
    @MessageBody() data: { professionalId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { professionalId } = data;
    void client.join(`professional_${professionalId}`);

    client.emit('subscribed', {
      message: `Suscrito a actualizaciones de ubicación del profesional ${professionalId}`,
      professionalId,
    });
  }

  @SubscribeMessage('updateLocation')
  handleUpdateLocation(
    @MessageBody()
    data: {
      professionalId: string;
      latitude: number;
      longitude: number;
      isOnline: boolean;
    },
  ): void {
    const { professionalId, latitude, longitude, isOnline } = data;

    this.server.to(`professional_${professionalId}`).emit('locationUpdated', {
      professionalId,
      latitude,
      longitude,
      isOnline,
      timestamp: new Date().toISOString(),
    });

    this.server.to('general').emit('professionalStatusChanged', {
      professionalId,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  }

  sendNotificationToUser(userId: string, notification: unknown): void {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  sendNotificationToAll(notification: unknown): void {
    this.server.to('general').emit('notification', notification);
  }

  sendServiceStatusUpdate(
    serviceId: string,
    status: string,
    data: unknown,
  ): void {
    this.server.to(`service_${serviceId}`).emit('serviceStatusUpdated', {
      serviceId,
      status,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
