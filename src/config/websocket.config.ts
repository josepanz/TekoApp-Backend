import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../guards/ws-auth.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/locations',
})
@UseGuards(WsAuthGuard)
export class WebSocketConfig {
  @WebSocketServer()
  server: Server;

  // Manejar conexión de cliente
  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    
    // Unir al cliente a la sala general
    client.join('general');
    
    // Enviar mensaje de bienvenida
    client.emit('connected', {
      message: 'Conectado al servidor de TekoApp',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Manejar desconexión de cliente
  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    
    // Salir de todas las salas
    client.leaveAll();
  }

  // Suscribirse a actualizaciones de ubicación
  @SubscribeMessage('subscribeLocation')
  handleSubscribeLocation(
    @MessageBody() data: { professionalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { professionalId } = data;
    
    // Unir al cliente a la sala específica del profesional
    client.join(`professional_${professionalId}`);
    
    client.emit('subscribed', {
      message: `Suscrito a actualizaciones de ubicación del profesional ${professionalId}`,
      professionalId,
    });
  }

  // Actualizar ubicación de un profesional
  @SubscribeMessage('updateLocation')
  handleUpdateLocation(
    @MessageBody() data: { 
      professionalId: string; 
      latitude: number; 
      longitude: number; 
      isOnline: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { professionalId, latitude, longitude, isOnline } = data;
    
    // Emitir actualización a todos los clientes suscritos
    this.server.to(`professional_${professionalId}`).emit('locationUpdated', {
      professionalId,
      latitude,
      longitude,
      isOnline,
      timestamp: new Date().toISOString(),
    });
    
    // También emitir a la sala general para notificaciones
    this.server.to('general').emit('professionalStatusChanged', {
      professionalId,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  }

  // Enviar notificación a un usuario específico
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  // Enviar notificación a todos los usuarios
  sendNotificationToAll(notification: any) {
    this.server.to('general').emit('notification', notification);
  }

  // Enviar actualización de estado de servicio
  sendServiceStatusUpdate(serviceId: string, status: string, data: any) {
    this.server.to(`service_${serviceId}`).emit('serviceStatusUpdated', {
      serviceId,
      status,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
