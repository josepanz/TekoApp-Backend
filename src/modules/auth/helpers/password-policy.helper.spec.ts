import { BadRequestException } from '@nestjs/common';
import { PasswordPolicyHelper } from './password-policy.helper';

describe('PasswordPolicyHelper', () => {
  describe('isComplexEnough', () => {
    it('debe retornar true cuando la contraseña cumple todos los requisitos', () => {
      // Arrange
      const password = 'Abcdef1!';

      // Act
      const result = PasswordPolicyHelper.isComplexEnough(password);

      // Assert
      expect(result).toBe(true);
    });

    it('debe retornar false cuando falta un carácter especial', () => {
      // Arrange
      const password = 'Abcdefg1';

      // Act
      const result = PasswordPolicyHelper.isComplexEnough(password);

      // Assert
      expect(result).toBe(false);
    });

    it('debe retornar false cuando tiene menos de 8 caracteres', () => {
      // Arrange
      const password = 'Ab1!';

      // Act
      const result = PasswordPolicyHelper.isComplexEnough(password);

      // Assert
      expect(result).toBe(false);
    });

    it('debe retornar false cuando falta una mayúscula', () => {
      // Arrange
      const password = 'abcdef1!';

      // Act
      const result = PasswordPolicyHelper.isComplexEnough(password);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('assertComplexity', () => {
    it('no debe lanzar cuando la contraseña es válida', () => {
      // Act & Assert
      expect(() =>
        PasswordPolicyHelper.assertComplexity('Abcdef1!'),
      ).not.toThrow();
    });

    it('debe lanzar BadRequestException cuando la contraseña es débil', () => {
      // Act & Assert
      expect(() => PasswordPolicyHelper.assertComplexity('weak')).toThrow(
        BadRequestException,
      );
    });
  });
});
