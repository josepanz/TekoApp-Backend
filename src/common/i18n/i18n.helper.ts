import * as fs from 'fs';
import * as path from 'path';

import { I18nContext } from 'nestjs-i18n';

/** Idioma por defecto de la API cuando no se puede resolver ninguno. */
export const DEFAULT_LANGUAGE = 'es';

/** Idiomas soportados (deben existir como carpeta en `src/i18n/<code>/`). */
export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Ruta absoluta a la carpeta de catálogos de traducción.
 *
 * Resuelve tanto en desarrollo/tests (`src/common/i18n` -> `src/i18n`) como en
 * el build compilado (`dist/common/i18n` -> `dist/i18n`), porque `nest-cli.json`
 * copia `src/i18n/**\/*.json` a `dist/i18n`.
 */
export const I18N_PATH = path.join(__dirname, '..', '..', 'i18n');

/** Argumentos de interpolación de un mensaje (`{clave}` dentro del texto). */
export type TranslationArgs = Record<string, unknown>;

/**
 * Catálogo del idioma por defecto, cargado de forma perezosa desde disco.
 *
 * Se usa como red de seguridad cuando `t()` se invoca FUERA del ciclo de vida de
 * un request HTTP (jobs de Bull, `@Cron`, gateways de WebSocket, unit tests…),
 * donde `I18nContext.current()` es `undefined` porque no hay `AsyncLocalStorage`
 * activo. Sin esto la API devolvería la clave cruda en esos caminos.
 */
let fallbackCatalog: Record<string, string> | null = null;

/** Aplana `{ NOT_FOUND: 'x' }` del archivo `users.json` a `{ 'users.NOT_FOUND': 'x' }`. */
function flatten(
  namespace: string,
  source: Record<string, unknown>,
  target: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(source)) {
    const fullKey = `${namespace}.${key}`;
    if (typeof value === 'string') target[fullKey] = value;
    else if (value && typeof value === 'object')
      flatten(fullKey, value as Record<string, unknown>, target);
  }
}

function loadFallbackCatalog(): Record<string, string> {
  if (fallbackCatalog) return fallbackCatalog;

  const catalog: Record<string, string> = {};
  const dir = path.join(I18N_PATH, DEFAULT_LANGUAGE);

  try {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const parsed: unknown = JSON.parse(
        fs.readFileSync(path.join(dir, file), 'utf8'),
      );
      if (parsed && typeof parsed === 'object')
        flatten(
          path.basename(file, '.json'),
          parsed as Record<string, unknown>,
          catalog,
        );
    }
  } catch {
    // Carpeta ausente (build incompleto): se devuelve la clave cruda.
  }

  fallbackCatalog = catalog;
  return catalog;
}

/** Resuelve `usuario.nombre` dentro de los argumentos de interpolación. */
function readArgPath(args: TranslationArgs, argPath: string): unknown {
  return argPath
    .split('.')
    .reduce<unknown>(
      (acc, segment) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[segment]
          : undefined,
      args,
    );
}

/** Serializa un argumento de interpolación sin caer en `[object Object]`. */
function stringifyArg(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(stringifyArg).join(', ');
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value) ?? '';
}

/**
 * Interpolación compatible con `string-format` (el formateador por defecto de
 * `nestjs-i18n`) para el catálogo de respaldo: reemplaza `{clave}` y `{a.b}`.
 */
function interpolate(template: string, args?: TranslationArgs): string {
  if (!args) return template;
  return template.replace(/\{([^{}]*)\}/g, (match, argPath: string) => {
    const value = readArgPath(args, argPath.trim());
    return value === undefined || value === null ? match : stringifyArg(value);
  });
}

/**
 * Traduce una clave del catálogo (`'<dominio>.<CLAVE>'`) al idioma negociado
 * para el request en curso.
 *
 * El idioma sale del `I18nContext` que `nestjs-i18n` publica por request (ver
 * `I18nModule` en `app.module.ts`: cabecera `x-lang`, luego `Accept-Language`,
 * con fallback a `es`). Fuera de un request se usa el catálogo `es`.
 *
 * @example
 * throw new NotFoundException(t('users.ID_NOT_FOUND', { id }));
 */
export function t(key: string, args?: TranslationArgs): string {
  const context = I18nContext.current();

  if (context) {
    return context.t(key, { args });
  }

  const template = loadFallbackCatalog()[key];
  return template === undefined ? key : interpolate(template, args);
}

/**
 * Formato que `i18nValidationMessage()` deja en `constraints`: `clave|{"args"}`.
 * Se resuelve manualmente (en vez de con `formatI18nErrors`) porque el
 * `ValidationPipe` global se instancia sin contenedor de DI en
 * `MiddlewareConfig.setup()` y por lo tanto no tiene un `I18nService` inyectado.
 */
function translateConstraint(rawConstraint: string): string {
  const separatorIndex = rawConstraint.indexOf('|');
  if (separatorIndex === -1) return rawConstraint;

  const key = rawConstraint.slice(0, separatorIndex);
  let args: TranslationArgs = {};

  try {
    const parsed: unknown = JSON.parse(rawConstraint.slice(separatorIndex + 1));
    if (parsed && typeof parsed === 'object') {
      const raw = parsed as TranslationArgs;
      const positional = Array.isArray(raw.constraints)
        ? Object.fromEntries(
            (raw.constraints as unknown[]).map((value, index) => [
              String(index),
              value,
            ]),
          )
        : raw.constraints;
      args = { ...raw, constraints: positional };
    }
  } catch {
    // Constraint sin argumentos serializables: se traduce solo por clave.
  }

  return t(key, args);
}

/**
 * Traduce todos los mensajes de un mapa de `constraints` de `class-validator`.
 * Los mensajes que no fueron generados con `i18nValidationMessage()` (los
 * defaults de la librería) se devuelven intactos.
 */
export function translateValidationConstraints(
  constraints: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!constraints) return constraints;

  return Object.fromEntries(
    Object.entries(constraints).map(([key, value]) => [
      key,
      translateConstraint(value),
    ]),
  );
}

/** Reinicia el catálogo de respaldo. Uso exclusivo de tests. */
export function resetFallbackCatalogForTests(): void {
  fallbackCatalog = null;
}
