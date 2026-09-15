import { ArgumentsHost, ForbiddenException } from '@nestjs/common';
import { TRACE_ID_HEADER } from '@core/middlewares/trace-id.middleware';
import { AllExceptionsFilter } from './http-exception.filter';
import { SentryReporterService } from '@modules/observability/services/sentry-reporter.service';

const mockJson = jest.fn();
const mockStatus = jest.fn(() => ({ json: mockJson }));
const mockCaptureException = jest.fn();

function buildHost(request: Record<string, unknown>): ArgumentsHost {
  const response = { status: mockStatus };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
}

function extractJsonBody(): { statusCode: number; message: string } {
  const call = mockJson.mock.calls[0] as unknown[];
  return call[0] as { statusCode: number; message: string };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new AllExceptionsFilter({
      captureException: mockCaptureException,
    } as unknown as SentryReporterService);
  });

  it('debe responder 500 genérico ante una excepción no-HttpException', () => {
    // Arrange
    const exception = new Error('algo raro pasó');
    const request = { url: '/x', method: 'GET', headers: {} };

    // Act
    filter.catch(exception, buildHost(request));

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(extractJsonBody().message).toBe('Error interno del servidor');
  });

  it('debe responder con el status real cuando la excepción SÍ es HttpException', () => {
    // Arrange
    const exception = new ForbiddenException('nop');
    const request = { url: '/x', method: 'GET', headers: {} };

    // Act
    filter.catch(exception, buildHost(request));

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(extractJsonBody().message).toBe('nop');
  });

  it('debe reportar la excepción a SentryReporterService con ruta, método, requestId, userId, body y query (el sanitizado de body/query pasa por SentryReporterService.captureException, no acá)', () => {
    // Arrange
    const exception = new Error('boom');
    const request = {
      url: '/payments/1/refund',
      method: 'POST',
      headers: {},
      [TRACE_ID_HEADER]: 'trace-abc',
      user: { id: 7 },
      body: { amount: 100 },
      query: { foo: 'bar' },
    };

    // Act
    filter.catch(exception, buildHost(request));

    // Assert
    expect(mockCaptureException).toHaveBeenCalledWith(exception, {
      route: '/payments/1/refund',
      method: 'POST',
      requestId: 'trace-abc',
      userId: 7,
      body: { amount: 100 },
      query: { foo: 'bar' },
    });
  });

  it('debe resolver el requestId desde el header crudo si el middleware no lo setea en el request', () => {
    // Arrange
    const exception = new Error('boom');
    const request = {
      url: '/x',
      method: 'GET',
      headers: { [TRACE_ID_HEADER.toLowerCase()]: 'trace-from-header' },
    };

    // Act
    filter.catch(exception, buildHost(request));

    // Assert
    expect(mockCaptureException).toHaveBeenCalledWith(
      exception,
      expect.objectContaining({ requestId: 'trace-from-header' }),
    );
  });
});
