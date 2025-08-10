import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { LocationsService } from './locations.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/locations',
})
export class LocationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Socket>();

  constructor(
    private readonly locationsService: LocationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Verificar autenticación del cliente
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verificar el token JWT
      const payload = await this.jwtService.verifyAsync(token);
      const professionalId = payload.professionalId || payload.sub;
      
      if (professionalId) {
        this.connectedClients.set(professionalId, client);
        client.join(`professional:${professionalId}`);
        client.data.user = payload;
        console.log(`Cliente conectado: ${professionalId}`);
      } else {
        client.disconnect();
      }
    } catch (error) {
      console.error('Error en conexión WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Encontrar y remover el cliente desconectado
    for (const [professionalId, socket] of this.connectedClients.entries()) {
      if (socket === client) {
        this.connectedClients.delete(professionalId);
        console.log(`Cliente desconectado: ${professionalId}`);
        break;
      }
    }
  }

  @SubscribeMessage('updateLocation')
  @UseGuards(WsJwtGuard)
  async handleUpdateLocation(
    @MessageBody() data: { professionalId: string; location: UpdateLocationDto },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { professionalId, location } = data;
      
      // Actualizar ubicación en la base de datos
      const updatedProfessional = await this.locationsService.updateLocation(
        professionalId,
        location,
      );

      // Emitir actualización a todos los clientes interesados
      this.server.emit('locationUpdated', {
        professionalId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
        },
      });

      // Emitir confirmación al cliente que envió la actualización
      client.emit('locationUpdateConfirmed', {
        success: true,
        professional: updatedProfessional,
      });

      return { success: true };
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      client.emit('locationUpdateError', {
        success: false,
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('subscribeToProfessional')
  async handleSubscribeToProfessional(
    @MessageBody() data: { professionalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { professionalId } = data;
      client.join(`professional:${professionalId}`);
      client.emit('subscriptionConfirmed', {
        professionalId,
        message: 'Suscrito a actualizaciones de ubicación',
      });
    } catch (error) {
      client.emit('subscriptionError', {
        error: error.message,
      });
    }
  }

  @SubscribeMessage('unsubscribeFromProfessional')
  async handleUnsubscribeFromProfessional(
    @MessageBody() data: { professionalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { professionalId } = data;
      client.leave(`professional:${professionalId}`);
      client.emit('unsubscriptionConfirmed', {
        professionalId,
        message: 'Desuscrito de actualizaciones de ubicación',
      });
    } catch (error) {
      client.emit('unsubscriptionError', {
        error: error.message,
      });
    }
  }

  // Método para emitir actualizaciones de ubicación a clientes específicos
  emitLocationUpdate(professionalId: string, location: any) {
    this.server.to(`professional:${professionalId}`).emit('locationUpdated', {
      professionalId,
      location,
      timestamp: new Date(),
    });
  }

  // Método para emitir cambios de estado del profesional
  emitProfessionalStatusChange(professionalId: string, status: any) {
    this.server.to(`professional:${professionalId}`).emit('professionalStatusChanged', {
      professionalId,
      status,
      timestamp: new Date(),
    });
  }

  // Método para obtener estadísticas de conexiones
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Método para obtener lista de profesionales conectados
  getConnectedProfessionals(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
