/**
 * Captura y resumen de logs de servicios para el informe e2e (estándar QA §3.7).
 *
 * - `parseServiceLog` es puro (sin I/O): cuenta ERROR/FATAL, respuestas 5xx, errores no manejados y WARN, y
 *   guarda las primeras líneas de error textuales. Entiende el formato multilínea de `pino-pretty` de la app
 *   (`[HH:MM:SS.mmm] ERROR (servicio):` + campos indentados con `message: "..."`) y, como respaldo, líneas
 *   sueltas de los contenedores (Postgres, Mongo, Redis, MinIO, MailHog).
 * - `captureDockerLogs` / `summarizeLogsDir` hacen el I/O (docker compose logs; lectura de la carpeta).
 */
import { execFileSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { resolve } from 'path';

export const MAX_ERROR_LINES = 10;
const MAX_LINE_LENGTH = 300;

export interface ServiceLogSummary {
  service: string;
  file: string;
  lines: number;
  errors: number; // líneas/registros ERROR o FATAL
  fatals: number; // subconjunto de errors: FATAL / PANIC
  status5xx: number; // respuestas HTTP 5xx
  unhandled: number; // UnhandledPromiseRejection, uncaughtException, etc.
  warns: number;
  firstErrors: string[]; // primeras MAX_ERROR_LINES, textuales
}

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
export const stripAnsi = (s: string): string => s.replace(ANSI, '');

/** Inicio de un registro pino-pretty: `[14:49:20.124] ERROR (TekoApp-E2E):` */
const PINO_START =
  /^\[\d{2}:\d{2}:\d{2}(?:\.\d+)?\]\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\b/;
/** Campo `message` de pino-pretty: `    message: "Error | POST /x - (409 - CONFLICT) | ..."` */
const PINO_MESSAGE = /^\s+message:\s*"(.*)"\s*$/;
/** Status de nuestras líneas: `(409 - CONFLICT)` o `(503)` */
const STATUS_IN_MESSAGE = /\((\d{3})(?:\s+-\s+[A-Z_]+)?\)/;
const STATUS_FIELD = /^\s+"?statusCode"?:\s*(\d{3})\b/;
const UNHANDLED =
  /UnhandledPromiseRejection|unhandledRejection|uncaughtException|Unhandled(?:\s+\w+)?\s+(?:exception|error|rejection)/i;
/** `[Nest] 123  - 10/13/2026, 2:49:20 PM   ERROR [ExceptionsHandler] msg` */
const NEST_LINE = /^\[Nest\]\s.*?\s(LOG|ERROR|WARN|FATAL|DEBUG|VERBOSE)\s/;
const PLAIN_ERROR = /(?:^|[\s\]|:])(ERROR|FATAL|PANIC)\b/;
const PLAIN_WARN = /(?:^|[\s\]|:])(WARN|WARNING)\b/;
/** Request HTTP en logs de acceso de contenedores (MinIO/MailHog): `" 503 ` tras el método y la ruta. */
/** Encabezado de un bloque de `console.*` de jest: corta el registro pino anterior. */
const JEST_CONSOLE = /^\s*console\.(?:log|info|warn|error|debug)\s*$/;
/** Mongo (JSON estructurado): `"s":"E"` error, `"F"` fatal, `"W"` warning. */
const MONGO_SEVERITY = /"s":"([EFW])"/;
/** Redis: `1:M 13 Oct 2026 14:49:20.123 # Warning ...` (`#` = warning). */
const REDIS_WARNING = /^\d+:[A-Z]\s.*\s#\s/;
const ACCESS_5XX = /"\s+(5\d{2})\s/;

const truncate = (s: string): string =>
  s.length > MAX_LINE_LENGTH ? `${s.slice(0, MAX_LINE_LENGTH)}...` : s;

interface LogEntry {
  level: string;
  message: string | undefined;
  head: string;
  status: number | undefined;
  unhandled: boolean;
}

export function parseServiceLog(
  service: string,
  raw: string,
  file = `${service}.log`,
): ServiceLogSummary {
  const lines = stripAnsi(raw).split(/\r?\n/);
  const summary: ServiceLogSummary = {
    service,
    file,
    lines:
      raw === '' ? 0 : lines.length - (lines[lines.length - 1] === '' ? 1 : 0),
    errors: 0,
    fatals: 0,
    status5xx: 0,
    unhandled: 0,
    warns: 0,
    firstErrors: [],
  };
  const addError = (text: string): void => {
    if (summary.firstErrors.length < MAX_ERROR_LINES) {
      summary.firstErrors.push(truncate(text.trim()));
    }
  };

  // La misma respuesta 5xx deja varias líneas (el interceptor y el log HTTP): se cuenta una vez por Trace ID.
  const seen5xx = new Set<string>();
  const isRepeated = (rec: LogEntry): boolean => {
    const trace = /Trace ID:\s*(\S+)/.exec(rec.message ?? rec.head)?.[1];
    if (!trace) return false;
    const key = `${trace}:${rec.status}`;
    if (seen5xx.has(key)) return true;
    seen5xx.add(key);
    return false;
  };

  const flush = (rec: LogEntry | undefined): void => {
    if (!rec) return;
    if (rec.level === 'ERROR' || rec.level === 'FATAL') {
      summary.errors += 1;
      if (rec.level === 'FATAL') summary.fatals += 1;
      addError(`${rec.level}: ${rec.message ?? rec.head}`);
    } else if (rec.level === 'WARN') {
      summary.warns += 1;
    }
    if (rec.status !== undefined && rec.status >= 500 && !isRepeated(rec)) {
      summary.status5xx += 1;
      // un 5xx loguado como INFO/WARN igual hay que mostrarlo
      if (rec.level !== 'ERROR' && rec.level !== 'FATAL') {
        addError(`5xx: ${rec.message ?? rec.head}`);
      }
    }
    if (rec.unhandled) {
      summary.unhandled += 1;
      if (rec.level !== 'ERROR' && rec.level !== 'FATAL') {
        addError(`NO MANEJADO: ${rec.message ?? rec.head}`);
      }
    }
  };

  let current: LogEntry | undefined;
  for (const line of lines) {
    const start = PINO_START.exec(line);
    if (start) {
      flush(current);
      current = {
        level: start[1],
        message: undefined,
        head: line,
        status: undefined,
        unhandled: UNHANDLED.test(line),
      };
      continue;
    }
    if (current) {
      // Un registro pino-pretty sigue mientras las líneas estén indentadas o vacías (el cuerpo del
      // `stack`/`response` viene con saltos escapados, no con líneas nuevas sin sangría).
      const inRecord =
        (/^\s/.test(line) || line === '' || line === '}') &&
        !JEST_CONSOLE.test(line);
      if (inRecord) {
        const msg = PINO_MESSAGE.exec(line);
        if (msg) {
          current.message = msg[1];
          const st = STATUS_IN_MESSAGE.exec(msg[1]);
          if (st) current.status = Number(st[1]);
        }
        const sf = STATUS_FIELD.exec(line);
        if (sf && current.status === undefined) current.status = Number(sf[1]);
        if (UNHANDLED.test(line)) current.unhandled = true;
        continue;
      }
      flush(current);
      current = undefined;
    }

    // Línea suelta (no pino-pretty): Nest Logger, contenedores, stderr de Node.
    if (line.trim() === '') continue;
    const nest = NEST_LINE.exec(line);
    let level = '';
    if (nest) level = nest[1];
    else if (MONGO_SEVERITY.test(line)) {
      const sev = MONGO_SEVERITY.exec(line)![1];
      level = sev === 'E' ? 'ERROR' : sev === 'F' ? 'FATAL' : 'WARN';
    } else if (PLAIN_ERROR.test(line)) level = PLAIN_ERROR.exec(line)![1];
    else if (PLAIN_WARN.test(line) || REDIS_WARNING.test(line)) level = 'WARN';
    const access = ACCESS_5XX.exec(line);
    flush({
      level: level === 'PANIC' ? 'FATAL' : level,
      message: undefined,
      head: line,
      status: access ? Number(access[1]) : undefined,
      unhandled: UNHANDLED.test(line),
    });
  }
  flush(current);
  return summary;
}

const SERVICE_ORDER = ['app', 'app-stderr'];

/** Lee `<dir>/*.log` y devuelve un resumen por archivo (la app primero, luego los contenedores). */
export function summarizeLogsDir(dir: string): ServiceLogSummary[] {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.log'));
  const name = (f: string): string => f.replace(/\.log$/, '');
  files.sort((a, b) => {
    const ia = SERVICE_ORDER.indexOf(name(a));
    const ib = SERVICE_ORDER.indexOf(name(b));
    if (ia !== -1 || ib !== -1)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });
  return files.map((f) =>
    parseServiceLog(name(f), readFileSync(resolve(dir, f), 'utf8'), f),
  );
}

/** Sección 7 del informe (estándar §3.7). `logsRel` es la ruta relativa de la carpeta, para citarla. */
export function buildLogsSection(
  summaries: ServiceLogSummary[],
  logsRel: string,
): string {
  const L: string[] = ['## 7. Logs de servicios', ''];
  if (summaries.length === 0) {
    L.push(
      `_No se capturaron logs en esta corrida (se esperaba \`${logsRel}\`). El veredicto no puede ser APROBADO sin ellos._`,
      '',
    );
    return L.join('\n');
  }
  L.push(
    `Carpeta de artefactos (gitignoreada): \`${logsRel}\`. \`app\` es el stdout de la app in-process de jest (pino) y \`app-stderr\` su stderr; el resto es \`docker compose -f docker-compose.e2e.yml logs\` por contenedor.`,
    '',
    '| Servicio | Archivo | Líneas | ERROR/FATAL | 5xx | No manejados | WARN |',
    '|---|---|---|---|---|---|---|',
  );
  for (const s of summaries) {
    L.push(
      `| ${s.service} | \`${s.file}\` | ${s.lines} | ${s.errors} (${s.fatals} fatal) | ${s.status5xx} | ${s.unhandled} | ${s.warns} |`,
    );
  }
  L.push('');
  const total5xx = summaries.reduce((n, s) => n + s.status5xx, 0);
  const totalUnhandled = summaries.reduce((n, s) => n + s.unhandled, 0);
  const totalErrors = summaries.reduce((n, s) => n + s.errors, 0);
  L.push(
    total5xx > 0 || totalUnhandled > 0
      ? `**Atención: ${total5xx} respuesta(s) 5xx y ${totalUnhandled} error(es) no manejado(s) en los logs. Con tests en verde igual impiden el veredicto APROBADO hasta explicarlos (caso negativo esperado, con su CP) o registrarlos como DEF.**`
      : `Sin respuestas 5xx ni errores no manejados en los logs (${totalErrors} línea(s) ERROR/FATAL en total, ver abajo).`,
    '',
    `### Primeras ${MAX_ERROR_LINES} líneas de error por servicio`,
    '',
  );
  for (const s of summaries) {
    L.push(`#### ${s.service}`, '');
    if (s.firstErrors.length === 0) L.push('Ninguna.', '');
    else L.push('```text', ...s.firstErrors, '```', '');
  }
  L.push(
    '### Revisión',
    '',
    '_COMPLETAR A MANO: explicar cada 5xx / error no manejado (esperado por un caso negativo, con su CP) o registrarlo como DEF-BE-NNN en la sección 3._',
    '',
  );
  return L.join('\n');
}

/**
 * Guarda `docker compose logs --no-color --no-log-prefix <servicio>` de cada servicio del compose e2e en
 * `<dir>/<servicio>.log`. Un servicio que falla al leerse deja un archivo con el motivo (no corta la corrida).
 */
export function captureDockerLogs(
  dir: string,
  cwd: string,
  composeFile = 'docker-compose.e2e.yml',
): string[] {
  mkdirSync(dir, { recursive: true });
  const run = (args: string[]): string =>
    execFileSync('docker', ['compose', '-f', composeFile, ...args], {
      cwd,
      stdio: 'pipe',
      maxBuffer: 256 * 1024 * 1024,
    }).toString();
  let services: string[] = [];
  try {
    services = run(['config', '--services'])
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .sort();
  } catch (e) {
    writeFileSync(
      resolve(dir, 'docker.log'),
      `No se pudo listar los servicios del compose: ${e instanceof Error ? e.message : String(e)}\n`,
    );
    return ['docker'];
  }
  for (const svc of services) {
    try {
      writeFileSync(
        resolve(dir, `${svc}.log`),
        run(['logs', '--no-color', '--no-log-prefix', svc]),
      );
    } catch (e) {
      writeFileSync(
        resolve(dir, `${svc}.log`),
        `No se pudieron leer los logs de ${svc}: ${e instanceof Error ? e.message : String(e)}\n`,
      );
    }
  }
  return services;
}
