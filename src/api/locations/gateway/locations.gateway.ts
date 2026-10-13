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

import { t } from '@common/i18n/i18n.helper';
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
      const token = (client.handshake.auth.token ||
        client.handshake.headers.authorization) as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      (client.data as Record<string, unknown>).user = payload;

      // El JWT nunca trae `professionalId` — se resuelve contra la DB. Un cliente (no
      // profesional) también puede conectarse (ej. para ver profesionales cercanos en el mapa),
      // así que no encontrar un Professional para este User no es motivo de desconexión.
      try {
        const professionalId =
          await this.locationsService.resolveProfessionalIdByUserRef(
            payload.sub,
          );
        this.connectedClients.set(String(professionalId), client);
        (client.data as Record<string, unknown>).professionalId =
          professionalId;
        await client.join(`professional:${professionalId}`);
      } catch {
        // No es profesional (o sin perfil profesional todavía) — conexión válida igual, solo sin
        // sala de emisión propia.
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
    data: { location: UpdateLocationRequestDTO },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Nunca confiar en un `professionalId` mandado por el cliente (dejaba a cualquier
      // profesional autenticado actualizar la ubicación de OTRO profesional) — se usa el
      // resuelto en `handleConnection` a partir de su propio JWT.
      const professionalId = (client.data as Record<string, unknown>)
        .professionalId as number | undefined;
      if (!professionalId) {
        throw new Error(t('locations.PROFESSIONAL_NOT_FOUND'));
      }
      const { location } = data;

      const updatedProfessional = await this.locationsService.updateLocation(
        professionalId,
        location,
      );

      const timestamp = new Date();
      // Canal global: SOLO posición aproximada y solo si el profesional está en línea. La
      // coordenada exacta nunca se difunde a todos los sockets conectados.
      if (updatedProfessional.isOnline) {
        this.server.emit('locationUpdated', {
          professionalId,
          location: {
            ...this.locationsService.approximate(
              professionalId,
              location.latitude,
              location.longitude,
            ),
            timestamp,
          },
        });
      }
      // Canal exacto: solo la sala del profesional (él mismo + suscriptores autorizados).
      this.server
        .to(`professional:${professionalId}`)
        .emit('exactLocationUpdated', {
          professionalId,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp,
          },
        });

      client.emit('locationUpdateConfirmed', {
        success: true,
        professional: updatedProfessional,
      });

      return { success: true };
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      client.emit('locationUpdateError', {
        success: false,
        error: errMsg,
      });
      return { success: false, error: errMsg };
    }
  }

  @SubscribeMessage('subscribeToProfessional')
  @UseGuards(WsJwtGuard)
  async handleSubscribeToProfessional(
    @MessageBody() data: { professionalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Misma regla que GET /locations/professional/:id (propio, admin o servicio activo).
    const professionalId = Number(data?.professionalId);
    const user = (client.data as Record<string, unknown>).user as
      | { sub?: string }
      | undefined;
    if (!Number.isInteger(professionalId) || !user?.sub) {
      client.emit('subscriptionError', {
        professionalId: data?.professionalId,
        error: t('locations.INVALID_PROFESSIONAL_ID'),
      });
      return;
    }
    const allowed = await this.locationsService.canViewExactLocation(
      user.sub,
      professionalId,
    );
    if (!allowed) {
      client.emit('subscriptionError', {
        professionalId: data.professionalId,
        error: t('locations.EXACT_LOCATION_FORBIDDEN'),
      });
      return;
    }
    await client.join(`professional:${professionalId}`);
    client.emit('subscriptionConfirmed', {
      professionalId: data.professionalId,
      message: t('locations.SUBSCRIBED'),
    });
  }

  @SubscribeMessage('unsubscribeFromProfessional')
  @UseGuards(WsJwtGuard)
  async handleUnsubscribeFromProfessional(
    @MessageBody() data: { professionalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`professional:${data.professionalId}`);
    client.emit('unsubscriptionConfirmed', {
      professionalId: data.professionalId,
      message: t('locations.UNSUBSCRIBED'),
    });
  }
}
