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
import { WsJwtGuard } from '@auth/guards/ws-jwt.guard';
import { LocationsService } from '../services/locations.service';
import { UpdateLocationRequestDTO } from '../dtos/request/update-location-request.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/locations',
})
export class LocationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private connectedClients = new Map<string, Socket>();

  constructor(
    private readonly locationsService: LocationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const professionalId = payload.professionalId || payload.sub;

      if (professionalId) {
        this.connectedClients.set(professionalId, client);
        await client.join(`professional:${professionalId}`);
        client.data.user = payload;
      } else {
        client.disconnect();
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [professionalId, socket] of this.connectedClients.entries()) {
      if (socket === client) {
        this.connectedClients.delete(professionalId);
        break;
      }
    }
  }

  @SubscribeMessage('updateLocation')
  @UseGuards(WsJwtGuard)
  async handleUpdateLocation(
    @MessageBody()
    data: { professionalId: number; location: UpdateLocationRequestDTO },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { professionalId, location } = data;

      const updatedProfessional = await this.locationsService.updateLocation(
        professionalId,
        location,
      );

      this.server.emit('locationUpdated', {
        professionalId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
        },
      });

      client.emit('locationUpdateConfirmed', {
        success: true,
        professional: updatedProfessional,
      });

      return { success: true };
    } catch (error: any) {
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
    await client.join(`professional:${data.professionalId}`);
    client.emit('subscriptionConfirmed', {
      professionalId: data.professionalId,
      message: 'Suscrito a actualizaciones de ubicación',
    });
  }

  @SubscribeMessage('unsubscribeFromProfessional')
  async handleUnsubscribeFromProfessional(
    @MessageBody() data: { professionalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`professional:${data.professionalId}`);
    client.emit('unsubscriptionConfirmed', {
      professionalId: data.professionalId,
      message: 'Desuscrito de actualizaciones de ubicación',
    });
  }
}
