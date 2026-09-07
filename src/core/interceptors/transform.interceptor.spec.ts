import { StreamableFile, ExecutionContext, CallHandler } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { Readable } from 'stream';
import { TransformInterceptor } from './transform.interceptor';

function buildContext(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/payments' }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as unknown as ExecutionContext;
}

function buildHandler(returnValue: unknown): CallHandler {
  return { handle: () => of(returnValue) } as CallHandler;
}

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('debe envolver una respuesta normal en el sobre {success, data, message, timestamp, path}', async () => {
    // Arrange
    const context = buildContext();
    const handler = buildHandler({ id: 1 });

    // Act
    const result = await firstValueFrom(
      interceptor.intercept(context, handler),
    );

    // Assert
    expect(result).toEqual(
      expect.objectContaining({ success: true, data: { id: 1 } }),
    );
  });

  it('debe dejar pasar un StreamableFile sin envolverlo (rompería la descarga)', async () => {
    // Arrange
    const file = new StreamableFile(Readable.from(Buffer.from('a,b\n1,2')));
    const context = buildContext();
    const handler = buildHandler(file);

    // Act
    const result = await firstValueFrom(
      interceptor.intercept(context, handler),
    );

    // Assert
    expect(result).toBe(file);
  });
});
