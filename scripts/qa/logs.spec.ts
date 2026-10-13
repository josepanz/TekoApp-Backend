/**
 * Suite: parser de logs del informe e2e (scripts/qa/logs.ts), estándar QA §3.7.
 * Casos: CP-BE-ENV-005 (ver test/qa/casos/CP-ENV.md)
 * Tipo: unitaria   Prioridad: P2
 * Precondiciones: sin infraestructura; logs sintéticos con el formato real de pino-pretty y de los contenedores.
 * Trazabilidad: pedido de José 2026-10-13 (sección 7 del informe con conteos por servicio).
 */
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  buildLogsSection,
  MAX_ERROR_LINES,
  parseServiceLog,
  stripAnsi,
  summarizeLogsDir,
} from './logs';

const ESC = String.fromCharCode(27);
const c = (code: number, s: string): string => `${ESC}[${code}m${s}${ESC}[39m`;

/** Registro con el formato real de pino-pretty (colorize: true, singleLine: false). */
const pino = (
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
  message: string,
  extra: string[] = [],
): string =>
  [
    `[14:49:20.124] ${c(32, level)} (TekoApp-E2E):`,
    `    ${c(35, 'service')}: "TekoApp-E2E"`,
    `    ${c(35, 'stack')}: "ConflictException: x\\n    at Foo (a.ts:1:1)"`,
    ...extra,
    `    ${c(35, 'message')}: "${message}"`,
    `    error: "x"`,
  ].join('\n');

describe('stripAnsi', () => {
  it('debe quitar los códigos de color', () => {
    expect(stripAnsi(c(31, 'ERROR'))).toBe('ERROR');
  });
});

describe('parseServiceLog (app, pino-pretty)', () => {
  it('debe contar un 4xx manejado como WARN, no como ERROR ni 5xx', () => {
    const raw = pino(
      'WARN',
      'Error | POST /api/v1/x - (409 - CONFLICT) | Trace ID: 1',
    );

    const s = parseServiceLog('app', raw);

    expect(s).toMatchObject({
      errors: 0,
      warns: 1,
      status5xx: 0,
      unhandled: 0,
    });
    expect(s.firstErrors).toEqual([]);
  });

  it('debe contar ERROR con 5xx y guardar la línea textual (sin ANSI)', () => {
    const raw = pino(
      'ERROR',
      'Error | GET /api/v1/locations/nearby - (500 - INTERNAL_SERVER_ERROR) | Trace ID: 2',
    );

    const s = parseServiceLog('app', raw);

    expect(s.errors).toBe(1);
    expect(s.status5xx).toBe(1);
    expect(s.firstErrors).toEqual([
      'ERROR: Error | GET /api/v1/locations/nearby - (500 - INTERNAL_SERVER_ERROR) | Trace ID: 2',
    ]);
  });

  it('debe contar un 5xx también cuando viene en un registro INFO o WARN, y mostrarlo', () => {
    const raw = pino('INFO', 'Error | GET /x - (503) | Trace ID: 3');

    const s = parseServiceLog('app', raw);

    expect(s.errors).toBe(0);
    expect(s.status5xx).toBe(1);
    expect(s.firstErrors[0]).toContain('5xx: Error | GET /x - (503)');
  });

  it('debe contar una sola vez la misma respuesta 5xx que dejó varias líneas (mismo Trace ID)', () => {
    const raw = [
      pino(
        'ERROR',
        'Error | GET /x - (503 - SERVICE_UNAVAILABLE) | Trace ID: abc',
      ),
      pino('INFO', 'Error | GET /x - (503) | Trace ID: abc'),
      pino(
        'ERROR',
        'Error | GET /x - (503 - SERVICE_UNAVAILABLE) | Trace ID: def',
      ),
    ].join('\n');

    const s = parseServiceLog('app', raw);

    expect(s.status5xx).toBe(2);
    expect(s.errors).toBe(2);
  });

  it('debe tomar el status de un campo statusCode si el mensaje no lo trae', () => {
    const raw = pino('INFO', 'request completed', [
      '    res: {',
      '      "statusCode": 502',
      '    }',
    ]);

    expect(parseServiceLog('app', raw).status5xx).toBe(1);
  });

  it('no debe confundir un 2xx ni un 4xx con 5xx', () => {
    const raw = [
      pino('INFO', 'Success | GET /x - (200 - OK) | Trace ID: 4'),
      pino('WARN', 'End | GET /x - (404) | Trace ID: 5'),
    ].join('\n');

    expect(parseServiceLog('app', raw)).toMatchObject({
      status5xx: 0,
      errors: 0,
      warns: 1,
    });
  });

  it('debe contar FATAL como error y como fatal', () => {
    const s = parseServiceLog('app', pino('FATAL', 'se cayó'));

    expect(s).toMatchObject({ errors: 1, fatals: 1 });
  });

  it('debe contar errores no manejados (UnhandledPromiseRejection, uncaughtException)', () => {
    const raw = [
      '[UnhandledPromiseRejection: This error originated either by throwing inside of an async function]',
      pino('ERROR', 'uncaughtException: boom'),
    ].join('\n');

    const s = parseServiceLog('app', raw);

    expect(s.unhandled).toBe(2);
    expect(s.firstErrors.some((l) => l.startsWith('NO MANEJADO:'))).toBe(true);
  });

  it('debe cortar el registro en un bloque console.log de jest (su contenido no es del registro anterior)', () => {
    const raw = [
      pino('INFO', 'Success | GET /x - (200 - OK) | Trace ID: 6'),
      '  console.log',
      '    ERROR en un log de debug del test',
      '',
    ].join('\n');

    const s = parseServiceLog('app', raw);

    // la línea del bloque de console se evalúa como línea suelta, no se pierde
    expect(s.errors).toBe(1);
  });

  it('debe limitar a 10 las líneas de error guardadas y truncar las larguísimas', () => {
    const raw = Array.from({ length: 15 }, (_, i) =>
      pino('ERROR', `fallo ${i} ${'x'.repeat(500)}`),
    ).join('\n');

    const s = parseServiceLog('app', raw);

    expect(s.errors).toBe(15);
    expect(s.firstErrors).toHaveLength(MAX_ERROR_LINES);
    expect(s.firstErrors[0].startsWith('ERROR: fallo 0')).toBe(true);
    expect(s.firstErrors[0].endsWith('...')).toBe(true);
  });

  it('debe devolver ceros con un log vacío', () => {
    expect(parseServiceLog('app', '')).toMatchObject({
      lines: 0,
      errors: 0,
      status5xx: 0,
      unhandled: 0,
      warns: 0,
      firstErrors: [],
    });
  });
});

describe('parseServiceLog (contenedores)', () => {
  it('Postgres: debe contar ERROR y WARNING de líneas sueltas', () => {
    const raw = [
      '2026-10-13 14:49:20.100 UTC [88] LOG:  checkpoint starting',
      '2026-10-13 14:49:21.200 UTC [91] ERROR:  duplicate key value violates unique constraint "x"',
      '2026-10-13 14:49:21.200 UTC [91] DETAIL:  Key (a)=(1) already exists.',
      '2026-10-13 14:49:22.000 UTC [92] WARNING:  there is no transaction in progress',
    ].join('\n');

    const s = parseServiceLog('postgres', raw);

    expect(s).toMatchObject({ lines: 4, errors: 1, warns: 1 });
    expect(s.firstErrors[0]).toContain('ERROR:  duplicate key value');
  });

  it('Mongo: debe leer la severidad del JSON estructurado', () => {
    const raw = [
      '{"t":{"$date":"2026-10-13T14:49:20Z"},"s":"I","c":"NETWORK","msg":"ok"}',
      '{"t":{"$date":"2026-10-13T14:49:21Z"},"s":"W","c":"CONTROL","msg":"watch out"}',
      '{"t":{"$date":"2026-10-13T14:49:22Z"},"s":"E","c":"STORAGE","msg":"bad"}',
      '{"t":{"$date":"2026-10-13T14:49:23Z"},"s":"F","c":"CONTROL","msg":"dead"}',
    ].join('\n');

    expect(parseServiceLog('mongo', raw)).toMatchObject({
      errors: 2,
      fatals: 1,
      warns: 1,
    });
  });

  it('Redis: "#" marca un warning', () => {
    const raw = [
      '1:C 13 Oct 2026 14:49:20.000 * oO0OoO0OoO0Oo Redis is starting',
      '1:M 13 Oct 2026 14:49:20.100 # Possible overcommit_memory setting',
    ].join('\n');

    expect(parseServiceLog('redis', raw)).toMatchObject({
      warns: 1,
      errors: 0,
    });
  });

  it('debe contar un 5xx de un log de acceso', () => {
    const raw =
      '10.0.0.1 - - [13/Oct/2026:14:49:20] "PUT /bucket/key HTTP/1.1" 503 120';

    expect(parseServiceLog('minio', raw).status5xx).toBe(1);
  });
});

describe('summarizeLogsDir + buildLogsSection', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'qa-logs-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('debe resumir cada .log (app primero) y armar la sección 7 con conteos y primeras líneas', () => {
    writeFileSync(
      join(dir, 'postgres.log'),
      '2026-10-13 UTC [1] ERROR:  boom\n',
    );
    writeFileSync(
      join(dir, 'app.log'),
      pino('WARN', 'Error | POST /x - (409 - CONFLICT) | Trace ID: 1'),
    );
    writeFileSync(join(dir, 'ignorado.txt'), 'x');

    const summaries = summarizeLogsDir(dir);
    const md = buildLogsSection(
      summaries,
      'test/qa/informes/artefactos/c1/logs/',
    );

    expect(summaries.map((s) => s.service)).toEqual(['app', 'postgres']);
    expect(md).toContain('## 7. Logs de servicios');
    expect(md).toContain('| app | `app.log` |');
    expect(md).toContain(
      '| postgres | `postgres.log` | 1 | 1 (0 fatal) | 0 | 0 | 0 |',
    );
    expect(md).toContain('2026-10-13 UTC [1] ERROR:  boom');
    expect(md).toContain('Sin respuestas 5xx ni errores no manejados');
  });

  it('debe advertir que 5xx o errores no manejados impiden el APROBADO', () => {
    writeFileSync(
      join(dir, 'app.log'),
      pino(
        'ERROR',
        'Error | GET /x - (500 - INTERNAL_SERVER_ERROR) | Trace ID: 9',
      ),
    );

    const md = buildLogsSection(summarizeLogsDir(dir), 'logs/');

    expect(md).toContain('**Atención: 1 respuesta(s) 5xx');
    expect(md).toContain('impiden el veredicto APROBADO');
  });

  it('debe avisar si no hay logs capturados', () => {
    expect(summarizeLogsDir(join(dir, 'no-existe'))).toEqual([]);
    expect(buildLogsSection([], 'logs/')).toContain('No se capturaron logs');
  });
});
