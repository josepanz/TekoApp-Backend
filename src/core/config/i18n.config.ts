import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nOptions,
} from 'nestjs-i18n';

import { DEFAULT_LANGUAGE, I18N_PATH } from '@common/i18n/i18n.helper';

/** Cabecera propietaria para forzar el idioma ignorando `Accept-Language`. */
export const LANGUAGE_HEADER = 'x-lang';

/**
 * Configuración de internacionalización de los mensajes que la API devuelve en
 * runtime (excepciones y validaciones). La documentación de Swagger queda en
 * español y NO se traduce: es documentación para desarrolladores, no salida de
 * la API.
 *
 * Negociación de idioma, en orden de prioridad:
 *   1. Cabecera `x-lang` (override explícito, ej. `x-lang: en`).
 *   2. Cabecera `Accept-Language` estándar, con negociación por `q` y match
 *      laxo (`en-US` resuelve a `en`, `es-PY` a `es`).
 *   3. Fallback a español.
 */
export class I18nConfig {
  static getOptions(): I18nOptions {
    return {
      fallbackLanguage: DEFAULT_LANGUAGE,
      fallbacks: {
        'es-*': 'es',
        'en-*': 'en',
      },
      loaderOptions: {
        path: I18N_PATH,
        watch: false,
      },
      resolvers: [
        new HeaderResolver([LANGUAGE_HEADER]),
        AcceptLanguageResolver,
      ],
      // Una clave faltante devuelve la clave cruda en vez de tumbar el request.
      throwOnMissingKey: false,
      logging: false,
    };
  }
}
