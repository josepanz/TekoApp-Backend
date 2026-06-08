import { CanActivate, Injectable, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromHeader(client);

      if (!token) {
        throw new WsException('Token no proporcionado');
      }

      const payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      // Asignar el usuario al socket para uso posterior
      (client.data as Record<string, unknown>).user = payload;

      return true;
    } catch {
      throw new WsException('Token inválido');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const rawToken = (client.handshake.auth as Record<string, unknown>)[
      'token'
    ];
    const token =
      (typeof rawToken === 'string' ? rawToken : undefined) ||
      client.handshake.headers.authorization?.replace('Bearer ', '');
    return token;
  }
}
