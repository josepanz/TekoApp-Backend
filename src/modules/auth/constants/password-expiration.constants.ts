/**
 * Código de error usado cuando la contraseña de un usuario ya expiró.
 * Sigue el mismo patrón de `code` que `jwt-auth.guard.ts` (`TOKEN_EXPIRED`),
 * para que el frontend pueda distinguir este caso y redirigir al flujo de
 * cambio de contraseña expirada.
 */
export const PASSWORD_EXPIRED_CODE = 'PASSWORD_EXPIRED';

/** Mensaje, en español, para el caso de contraseña expirada. */
export const PASSWORD_EXPIRED_MESSAGE = 'La contraseña ha expirado.';

/** Milisegundos en un día — usado para calcular `expiredAt` a partir de N días. */
export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
