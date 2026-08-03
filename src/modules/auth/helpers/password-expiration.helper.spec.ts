import { UnauthorizedException } from '@nestjs/common';
import { PasswordExpirationHelper } from './password-expiration.helper';

describe('PasswordExpirationHelper', () => {
  describe('isExpired', () => {
    it('debe retornar false cuando expiredAt es null (expiración indefinida)', () => {
      // Act & Assert
      expect(PasswordExpirationHelper.isExpired(null)).toBe(false);
    });

    it('debe retornar false cuando expiredAt es una fecha futura', () => {
      // Arrange
      const future = new Date(Date.now() + 60_000);

      // Act & Assert
      expect(PasswordExpirationHelper.isExpired(future)).toBe(false);
    });

    it('debe retornar true cuando expiredAt ya pasó', () => {
      // Arrange
      const past = new Date(Date.now() - 60_000);

      // Act & Assert
      expect(PasswordExpirationHelper.isExpired(past)).toBe(true);
    });
  });

  describe('assertNotExpired', () => {
    it('no debe lanzar cuando expiredAt es null', () => {
      // Act & Assert
      expect(() =>
        PasswordExpirationHelper.assertNotExpired(null),
      ).not.toThrow();
    });

    it('debe lanzar UnauthorizedException con código PASSWORD_EXPIRED cuando expiró', () => {
      // Arrange
      const past = new Date(Date.now() - 1000);

      // Act & Assert
      expect(() => PasswordExpirationHelper.assertNotExpired(past)).toThrow(
        UnauthorizedException,
      );
      try {
        PasswordExpirationHelper.assertNotExpired(past);
      } catch (error) {
        const response = (error as UnauthorizedException).getResponse();
        expect(response).toMatchObject({ code: 'PASSWORD_EXPIRED' });
      }
    });
  });

  describe('computeExpiresAt', () => {
    it('debe retornar null cuando days es 0 (expiración indefinida)', () => {
      // Act & Assert
      expect(PasswordExpirationHelper.computeExpiresAt(0)).toBeNull();
    });

    it('debe retornar null cuando days es null o undefined', () => {
      // Act & Assert
      expect(PasswordExpirationHelper.computeExpiresAt(null)).toBeNull();
      expect(PasswordExpirationHelper.computeExpiresAt(undefined)).toBeNull();
    });

    it('debe retornar una fecha aproximadamente a N días en el futuro cuando days > 0', () => {
      // Arrange
      const before = Date.now();

      // Act
      const result = PasswordExpirationHelper.computeExpiresAt(30);

      // Assert
      expect(result).toBeInstanceOf(Date);
      const expectedMin = before + 30 * 24 * 60 * 60 * 1000;
      expect(result.getTime()).toBeGreaterThanOrEqual(expectedMin);
    });
  });
});
