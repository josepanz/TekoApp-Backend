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

/** Mensaje de error de complejidad, en español, para el usuario final. */
export const PASSWORD_COMPLEXITY_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial.';

/**
 * Mensaje de error, en español, cuando la contraseña nueva coincide con alguna de las
 * últimas `n` utilizadas. `n` se interpola desde `PASSWORD_HISTORY_LIMIT`.
 */
export const passwordReuseMessage = (n: number): string =>
  `La contraseña no puede coincidir con ninguna de las últimas ${n} contraseñas utilizadas.`;
