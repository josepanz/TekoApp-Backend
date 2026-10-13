import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { IUserDataOnJwt } from '../interfaces/user-data-on-jwt.interface';

/**
 * Autenticación opcional: en rutas públicas que cambian su respuesta según quién llama (ej.
 * `GET /categories/:id`, que solo muestra categorías ocultas a un admin). Nunca rechaza: con
 * token válido deja `request.user` poblado; sin token, vencido o inválido el request sigue como
 * anónimo (`user` queda `undefined`).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = IUserDataOnJwt>(err: unknown, user: unknown): TUser {
    return (err || !user ? undefined : user) as TUser;
  }
}
