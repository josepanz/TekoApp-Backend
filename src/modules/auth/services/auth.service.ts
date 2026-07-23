import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Users, UserStatus } from '@prisma/client';

import { AuthTokenService } from '@modules/auth/services/auth-token.service';
import { AuthPasswordService } from '@modules/auth/services/auth-password.service';
import { NonceService } from '@modules/auth/services/nonce.service';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { UserCredentialsWithUser } from '@/modules/auth/types';
import { PasswordExpirationHelper } from '@modules/auth/helpers';

/**
 * Servicio principal de autenticación - Lógica de Negocio
 * Usa helpers especializados para mantener el código organizado
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UsersDBService,
    private readonly authTokenService: AuthTokenService,
    private readonly authPasswordService: AuthPasswordService,
    private readonly nonceService: NonceService,
  ) {}

  /**
   * Procesa el login completo de un usuario
   */
  async login(payload: {
    email: string;
    encryptedPassword: string;
    userAgent?: string;
    rembemberMe: boolean;
  }): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    requiresPasswordCreation: boolean;
  }> {
    // Buscar credenciales
    const userCredentials = await this.userRepository.findCredentialsByEmail(
      payload.email,
    );

    // Si no tiene credenciales, verificar si existe
    if (!userCredentials) {
      const userExists = await this.userRepository.findActiveUserByEmail(
        payload.email,
      );

      if (userExists) {
        return { success: false, requiresPasswordCreation: true };
      }
      this.logger.log(
        'No se encontraron datos para los parámetros proporcionados.',
      );
      return { success: false, requiresPasswordCreation: false };
    }

    // Validar estado
    this.validateUserStatus(userCredentials.user.status);

    // Desencriptar y parsear el payload: { password, nonce }
    const { password, nonce } = this.authPasswordService.decryptLoginPayload(
      payload.encryptedPassword,
    );

    // Nonce anti-replay de uso único: se valida y consume atómicamente ANTES de
    // validar la contraseña. Si no existe (nunca emitido, ya usado o expirado),
    // se rechaza con el mismo mensaje genérico para no filtrar la causa.
    const nonceValid = await this.nonceService.consume(nonce);
    if (!nonceValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Validar contraseña (texto plano ya extraído del payload)
    const isPasswordValid = this.authPasswordService.validatePassword(
      password,
      userCredentials.passwordHash,
    );

    if (!isPasswordValid) {
      await this.authPasswordService.handleFailedAttempt(userCredentials);
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Rechazar el login si la contraseña de la credencial activa expiró
    PasswordExpirationHelper.assertNotExpired(userCredentials.expiredAt);

    // Resetear intentos fallidos
    await this.authPasswordService.resetFailedAttempts(userCredentials);

    // Actualizar último login
    await this.userRepository.updateLastLogin(userCredentials.userId);

    // Generar tokens
    const tokens = this.authTokenService.generateTokens({
      user: userCredentials.user,
      rememberMe: payload.rembemberMe,
    });

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      requiresPasswordCreation: false,
    };
  }

  /**
   * Crea una contraseña para un usuario
   */
  async createPassword(payload: {
    email: string;
    encryptedPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findActiveUserByEmail(payload.email);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    await this.authPasswordService.createOrUpdateEncryptedPassword(
      user.id,
      payload.encryptedPassword,
    );

    return {
      success: true,
      message: 'Contraseña creada correctamente.',
    };
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async changePassword(payload: {
    email: string;
    encryptedOldPassword: string;
    encryptedNewPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findActiveUserByEmail(payload.email);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const userCredentials = await this.userRepository.findCredentialsByEmail(
      payload.email,
    );

    if (!userCredentials) {
      throw new NotFoundException(
        'No se encontraron credenciales para el usuario, favor crear contraseña.',
      );
    }

    await this.authPasswordService.changeEncryptedPassword(
      userCredentials,
      payload.encryptedOldPassword,
      payload.encryptedNewPassword,
    );

    return {
      success: true,
      message: 'Contraseña actualizada correctamente.',
    };
  }

  /**
   * Cambia la contraseña de un usuario cuya contraseña YA expiró.
   *
   * Flujo pre-login (sin sesión JWT): valida la contraseña vieja contra el hash
   * de la credencial activa MÁS RECIENTE (aunque `expiredAt` ya pasó — la
   * expiración bloquea el login normal, no este flujo de recuperación), aplica
   * complejidad a la nueva y rota manteniendo el histórico. La nueva credencial
   * queda con `expiredAt = null`, restaurando el acceso.
   *
   * Reutiliza íntegramente la lógica de `changePassword` (que no valida
   * expiración), evitando duplicar reglas de negocio.
   */
  async changeExpiredPassword(payload: {
    email: string;
    encryptedOldPassword: string;
    encryptedNewPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return await this.changePassword(payload);
  }

  /**
   * Genera un nonce anti-replay de uso único para el login.
   */
  async generateNonce(): Promise<{ nonce: string }> {
    const nonce = await this.nonceService.issue();
    return { nonce };
  }

  /**
   * Resetea la contraseña (forgot password)
   */
  async resetPassword(payload: {
    email: string;
    encryptedNewPassword: string;
    encryptedConfirmPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    // Desencriptar y validar que coincidan
    const newPassword = this.authPasswordService.decryptPassword(
      payload.encryptedNewPassword,
    );
    const confirmPassword = this.authPasswordService.decryptPassword(
      payload.encryptedConfirmPassword,
    );

    if (newPassword !== confirmPassword) {
      throw new UnauthorizedException('Las contraseñas no coinciden.');
    }

    const user = await this.userRepository.findActiveUserByEmail(payload.email);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const userCredentials = await this.userRepository.findCredentialsByEmail(
      payload.email,
    );

    if (!userCredentials) {
      throw new NotFoundException(
        'No se encontraron credenciales para el usuario, favor crear contraseña.',
      );
    }

    await this.authPasswordService.createOrUpdatePassword(user.id, newPassword);

    return {
      success: true,
      message: 'Contraseña actualizada correctamente.',
    };
  }

  /**
   * Refresca el access token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    const newAccessToken =
      await this.authTokenService.generateAccessTokenFromRefresh(refreshToken);

    return { accessToken: newAccessToken };
  }

  /**
   * Obtiene el scope del usuario (roles y permisos)
   */
  async getUserScope(userId: number): Promise<{
    roles: Array<{ name: string; description: string | null }>;
    permissions: Array<{ name: string }>;
  }> {
    const roles = await this.userRepository.getUserRoles(userId);

    const userPermissions =
      await this.userRepository.getUserPermissions(userId);

    //  Obtener permisos de los roles
    const roleIds = roles.map((role) => role.id);
    const rolePermissions =
      await this.userRepository.getRolePermissions(roleIds);

    // Combinar permisos (roles + directos)
    const allPermissions = [...rolePermissions, ...userPermissions];

    // Deduplicar por 'name' (movements:read, customers:update, etc)
    const uniquePermissions = allPermissions.filter(
      (perm, index, self) =>
        index === self.findIndex((p) => p.name === perm.name),
    );

    return {
      roles: roles.map((role) => ({
        name: role.name,
        description: role.description,
      })),
      permissions: uniquePermissions,
    };
  }

  /**
   * Verifica un usuario
   */
  async verifyUser(userId: number): Promise<void> {
    await this.userRepository.verifyUser(userId);
  }

  /**
   * Verifica el estado de verificación
   */
  async checkVerificationStatus(
    user: Users,
  ): Promise<{ verified: boolean; email: string }> {
    const verifiedUser = await this.userRepository.findById(user.id);
    return {
      verified: verifiedUser?.status === UserStatus.ACTIVE,
      email: user.email,
    };
  }

  /**
   * Valida el estado de un usuario
   */
  private validateUserStatus(status: UserStatus): void {
    switch (status) {
      case UserStatus.BLOCKED:
        throw new UnauthorizedException('El usuario está bloqueado.');
      case UserStatus.INACTIVE:
        throw new UnauthorizedException('El usuario no está activo.');
      case UserStatus.DELETED:
        throw new UnauthorizedException('El usuario está eliminado.');
      case UserStatus.PENDING_VERIFICATION:
        this.logger.warn('El usuario no ha verificado su cuenta.');
        return;
      case UserStatus.ACTIVE:
        return;
    }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserCredentialsWithUser> {
    const userCredential =
      await this.userRepository.findCredentialsByEmail(email);

    if (userCredential) {
      this.validateUserStatus(userCredential.user.status);
    } else {
      this.logger.log(
        'No se encontraron datos para los parámetros proporcionados.',
      );
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    const isPasswordValid = this.authPasswordService.validateEncryptedPassword(
      password,
      userCredential.passwordHash,
    );

    if (!isPasswordValid) {
      await this.authPasswordService.handleFailedAttempt(userCredential);
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return userCredential;
  }
}
