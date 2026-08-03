import { Injectable, MessageEvent } from '@nestjs/common';
import { filter, map, Observable, Subject } from 'rxjs';

interface INotificationSseEvent {
  userId: number;
  event: MessageEvent;
}

/**
 * Puente en memoria entre la creación de una notificación (NotificationsProcessor, canal
 * 'in_app') y los clientes conectados por SSE. Un solo Subject compartido + filter por userId
 * evita manejar a mano un Map<userId, Set<conexión>> — cada pestaña abierta simplemente se
 * suscribe con su propio filtro, RxJS se encarga de multiplexar. Solo cubre "app abierta ahora
 * mismo" (ver notifications-push-architecture.md); Web Push/FCM son el canal para app cerrada.
 */
@Injectable()
export class NotificationsSseService {
  private readonly stream$ = new Subject<INotificationSseEvent>();

  subscribe(userId: number): Observable<MessageEvent> {
    return this.stream$.asObservable().pipe(
      filter((item) => item.userId === userId),
      map((item) => item.event),
    );
  }

  emit(userId: number, data: Record<string, unknown>): void {
    this.stream$.next({
      userId,
      event: { type: 'notification', data },
    });
  }
}
