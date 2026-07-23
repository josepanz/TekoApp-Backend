import { UserStatus } from '@prisma/client';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { UserCredentialsWithUser } from '@modules/auth/types';
import { CredentialsRepository } from '@modules/auth/repositories';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import {
  PasswordExpirationHelper,
  PasswordPolicyHelper,
} from '@modules/auth/helpers';
import { passwordReuseMessage } from '@modules/auth/constants';
import { ILoginPayload } from '@modules/auth/interfaces';

@Injectable()
export class AuthPasswordService {
  constructor(
    private readonly credentialsRepository: CredentialsRepository,
    private readonly userRepository: UsersDBService,
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {}

  // ==================== CRYPTO OPERATIONS ====================

  /**
   * Desencripta una contraseña encriptada con RSA
   */
  decryptPassword(encryptedPassword: string): string {
    try {
      const decryptedBuffer = CryptoHelper.decrypt(encryptedPassword, 'sha256');
      return decryptedBuffer.toString('utf-8');
    } catch {
      throw new UnauthorizedException('Error al procesar las credenciales.');
    }
  }

  /**
   * Valida una contraseña contra su hash
   */
  validatePassword(plainPassword: string, hashedPassword: string): boolean {
    return CryptoHelper.compareHashes(plainPassword, hashedPassword);
  }

  /**
   * Valida una contraseña encriptada contra su hash
   * (desencripta primero, luego valida)
   */

  validateEncryptedPassword(
    encryptedPassword: string,
    hashedPassword: string,
  ): boolean {
    const plainPassword = this.decryptPassword(encryptedPassword);
    return this.validatePassword(plainPassword, hashedPassword);
  }

  /**
   * Desencripta y parsea el payload del login. Desde el soporte de nonce
   * anti-replay, el valor cifrado es un JSON `{"password":"...","nonce":"..."}`.
   * Si la desencriptación, el `JSON.parse` o la forma del objeto fallan, se
   * responde con el mismo error genérico que el resto del login para no filtrar
   * información al atacante.
   */
  decryptLoginPayload(encryptedPassword: string): ILoginPayload {
    const raw = this.decryptPassword(encryptedPassword);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload = parsed as Partial<ILoginPayload>;
    if (
      !payload ||
      typeof payload.password !== 'string' ||
      typeof payload.nonce !== 'string'
    ) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return { password: payload.password, nonce: payload.nonce };
  }

  /**
   * Genera un hash de una contraseña
   */

  hashPassword(password: string): string {
    return CryptoHelper.hashValue(password);
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Maneja un intento fallido de login
   */
  async handleFailedAttempt(
    userCredential: UserCredentialsWithUser,
  ): Promise<{ shouldBlock: boolean }> {
    userCredential.attempts += 1;
    await this.credentialsRepository.updateAttempts(
      userCredential.id,
      userCredential.attempts,
    );

    const shouldBlock = userCredential.attempts > 3;

    if (shouldBlock) {
      await this.userRepository.updateStatus(
        userCredential.userId,
        UserStatus.BLOCKED,
      );
    }

    return { shouldBlock };
  }

  /**
   * Resetea los intentos fallidos después de un login exitoso
   */

  async resetFailedAttempts(
    userCredential: UserCredentialsWithUser,
  ): Promise<void> {
    if (userCredential.attempts > 0) {
      await this.credentialsRepository.updateAttempts(userCredential.id, 0);
    }
  }

  /**
   * Verifica que la contraseña nueva (texto plano) no coincida con ninguna de las
   * últimas `PASSWORD_HISTORY_LIMIT` credenciales del usuario (activas + inactivas).
   * Lanza `BadRequestException` si hay coincidencia. En el flujo de primera
   * contraseña (usuario sin credencial previa) simplemente no encuentra historial
   * y no bloquea nada.
   */
  private async assertNotReused(
    userId: number,
    plainPassword: string,
  ): Promise<void> {
    const limit = this.configService.authentication.passwordHistoryLimit;
    const recentCredentials =
      await this.credentialsRepository.findRecentByUserId(userId, limit);

    const isReused = recentCredentials.some((credential) =>
      CryptoHelper.compareHashes(plainPassword, credential.passwordHash),
    );

    if (isReused) {
      throw new BadRequestException(passwordReuseMessage(limit));
    }
  }

  /**
   * Fecha de expiración para la nueva credencial, según `PASSWORD_EXPIRATION_DAYS`
   * (0/sin setear = indefinida => `null`).
   */
  private resolveExpiresAt(): Date | null {
    return PasswordExpirationHelper.computeExpiresAt(
      this.configService.authentication.passwordExpirationDays,
    );
  }

  /**
   * Crea o rota la contraseña de un usuario manteniendo el histórico.
   * Valida complejidad y no-reuso (texto plano ya desencriptado) antes de hashear
   * e inserta una nueva fila activa, desactivando la(s) anterior(es).
   */
  async createOrUpdatePassword(
    userId: number,
    password: string,
  ): Promise<void> {
    PasswordPolicyHelper.assertComplexity(password);
    await this.assertNotReused(userId, password);
    const hash = this.hashPassword(password);
    await this.credentialsRepository.rotatePassword(
      userId,
      hash,
      this.resolveExpiresAt(),
    );
  }

  /**
   * Crea o actualiza la contraseña de un usuario (con password encriptada)
   */
  async createOrUpdateEncryptedPassword(
    userId: number,
    encryptedPassword: string,
  ): Promise<void> {
    const plainPassword = this.decryptPassword(encryptedPassword);
    await this.createOrUpdatePassword(userId, plainPassword);
  }

  /**
   * Cambia la contraseña de un usuario validando la anterior contra el hash de
   * su credencial activa. Valida complejidad de la nueva y rota manteniendo el
   * histórico (nueva fila activa + desactivación de la anterior).
   *
   * Nota: NO valida expiración; sirve tanto para el cambio logueado como para
   * el flujo de contraseña expirada (donde justamente hay que poder cambiarla
   * aunque `expiredAt` ya pasó).
   */
  async changePassword(
    userCredentials: UserCredentialsWithUser,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const passwordValid = this.validatePassword(
      oldPassword,
      userCredentials.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    PasswordPolicyHelper.assertComplexity(newPassword);
    await this.assertNotReused(userCredentials.userId, newPassword);
    const hash = this.hashPassword(newPassword);

    await this.credentialsRepository.rotatePassword(
      userCredentials.userId,
      hash,
      this.resolveExpiresAt(),
    );
  }

  /**
   * Cambia la contraseña de un usuario validando la anterior (con passwords encriptadas)
   */
  async changeEncryptedPassword(
    userCredentials: UserCredentialsWithUser,
    encryptedOldPassword: string,
    encryptedNewPassword: string,
  ): Promise<void> {
    const oldPassword = this.decryptPassword(encryptedOldPassword);
    const newPassword = this.decryptPassword(encryptedNewPassword);
    await this.changePassword(userCredentials, oldPassword, newPassword);
  }
}
