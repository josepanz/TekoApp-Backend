import {
  ArgumentsHost,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn(() => ({ json: mockJson }));

function extractJsonBody(): { error: Record<string, unknown> } {
  const call = mockJson.mock.calls[0] as unknown[];
  return call[0] as { error: Record<string, unknown> };
}

function buildHost(): ArgumentsHost {
  const response = { status: mockStatus };
  const request = { url: '/test' };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new HttpExceptionFilter();
  });

  it('debe responder sin errorCode cuando la excepción no lo define', () => {
    // Arrange
    const exception = new NotFoundException('No encontrado');

    // Act
    filter.catch(exception, buildHost());

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(404);
    const body = extractJsonBody();
    expect(body.error.message).toBe('No encontrado');
    expect(body.error).not.toHaveProperty('errorCode');
  });

  it('debe incluir errorCode cuando la excepción lo define, sin perder el message humano', () => {
    // Arrange
    const exception = new ForbiddenException({
      message: 'Necesitás aceptar el documento legal vigente',
      errorCode: 'CONSENT_REQUIRED',
    });

    // Act
    filter.catch(exception, buildHost());

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(403);
    const body = extractJsonBody();
    expect(body.error.message).toBe(
      'Necesitás aceptar el documento legal vigente',
    );
    expect(body.error.errorCode).toBe('CONSENT_REQUIRED');
  });
});
