/**
 * Reglas de complejidad de contraseña aplicadas a nivel de servicio, luego de
 * desencriptar el valor RSA y antes de hashear con bcrypt.
 */

/** Longitud mínima exigida. */
export const PASSWORD_MIN_LENGTH = 8;

/** Debe contener al menos una letra minúscula. */
export const PASSWORD_LOWERCASE_REGEX = /[a-z]/;

/** Debe contener al menos una letra mayúscula. */
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;

/** Debe contener al menos un dígito. */
export const PASSWORD_DIGIT_REGEX = /[0-9]/;

/** Debe contener al menos un carácter especial (no alfanumérico). */
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-z0-9]/;

/*
 * Los mensajes de error de esta política viven en el catálogo i18n
 * (`auth.PASSWORD_COMPLEXITY` y `auth.PASSWORD_REUSED`) y se resuelven con el
 * helper `t()` en el punto donde se lanza la excepción.
 */
