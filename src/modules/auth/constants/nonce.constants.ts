/**
 * Constantes del mecanismo anti-replay (nonce) del login.
 */

/** Token de inyección del cliente Redis dedicado a los nonce. */
export const NONCE_REDIS_CLIENT = 'NONCE_REDIS_CLIENT';

/** Prefijo de las claves de nonce dentro del namespace `tekoapp:` del store. */
export const NONCE_KEY_PREFIX = 'nonce:';

/** Tiempo de vida del nonce en segundos (ventana de uso corta). */
export const NONCE_TTL_SECONDS = 60;

/** Cantidad de bytes aleatorios del nonce (resulta en 32 chars hex). */
export const NONCE_RANDOM_BYTES = 16;
