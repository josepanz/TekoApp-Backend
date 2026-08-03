import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsSseService } from './notifications-sse.service';

describe('NotificationsSseService', () => {
  let service: NotificationsSseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsSseService],
    }).compile();

    service = module.get<NotificationsSseService>(NotificationsSseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('entrega el evento únicamente al usuario suscripto correspondiente', (done) => {
    // Arrange
    const receivedByUser10: unknown[] = [];
    const receivedByUser20: unknown[] = [];

    service.subscribe(10).subscribe((event) => receivedByUser10.push(event));
    service.subscribe(20).subscribe((event) => receivedByUser20.push(event));

    // Act
    service.emit(10, { title: 'Hola usuario 10' });

    // Assert
    setImmediate(() => {
      expect(receivedByUser10).toEqual([
        { type: 'notification', data: { title: 'Hola usuario 10' } },
      ]);
      expect(receivedByUser20).toEqual([]);
      done();
    });
  });

  it('permite múltiples suscripciones simultáneas del mismo usuario (varias pestañas)', (done) => {
    // Arrange
    const tab1: unknown[] = [];
    const tab2: unknown[] = [];
    service.subscribe(10).subscribe((event) => tab1.push(event));
    service.subscribe(10).subscribe((event) => tab2.push(event));

    // Act
    service.emit(10, { title: 'Nueva notificación' });

    // Assert
    setImmediate(() => {
      expect(tab1).toHaveLength(1);
      expect(tab2).toHaveLength(1);
      done();
    });
  });
});
