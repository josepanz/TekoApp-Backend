import { BadRequestException } from '@nestjs/common';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_DIGIT_REGEX,
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SPECIAL_REGEX,
  PASSWORD_UPPERCASE_REGEX,
} from '@modules/auth/constants';

/**
 * Helper de validación de complejidad de contraseña.
 * Se aplica siempre luego de desencriptar (RSA) y antes de hashear (bcrypt).
 */
export class PasswordPolicyHelper {
  /**
   * Indica si la contraseña en texto plano cumple la política de complejidad.
   */
  static isComplexEnough(plainPassword: string): boolean {
    return (
      typeof plainPassword === 'string' &&
      plainPassword.length >= PASSWORD_MIN_LENGTH &&
      PASSWORD_LOWERCASE_REGEX.test(plainPassword) &&
      PASSWORD_UPPERCASE_REGEX.test(plainPassword) &&
      PASSWORD_DIGIT_REGEX.test(plainPassword) &&
      PASSWORD_SPECIAL_REGEX.test(plainPassword)
    );
  }

  /**
   * Lanza `BadRequestException` con un mensaje claro en español si la
   * contraseña no cumple la política de complejidad.
   */
  static assertComplexity(plainPassword: string): void {
    if (!this.isComplexEnough(plainPassword)) {
      throw new BadRequestException(PASSWORD_COMPLEXITY_MESSAGE);
    }
  }
}
