import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Users } from '@prisma/client';

import * as DTO from '@api/auth/dtos';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { AuthService } from '@modules/auth/services/auth.service';
import { EmailService } from '@modules/email/services/email.service';
import { EmailTypeEnum } from '@modules/email/enum/email-type.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { UploadsService } from '@api/uploads/services/uploads.service';
import { AuthMigrationService } from './auth-migration.service';

@Injectable()
export class AuthApiService {
  private readonly logger = new Logger(AuthApiService.name);

  constructor(
    private readonly userService: UsersDBService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly authMigrationService: AuthMigrationService,
    private readonly uploadsService: UploadsService,
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {}

  /**
   * Tarea 6 (platform-hardening-2026-09, 2026-09-14): avisos de seguridad por email — nunca
   * deben poder tumbar el flujo principal (login/cambio de contraseña) si el SMTP falla, así
   * que se atrapan acá y solo se loguean. Mismo criterio que `UsersDBService.createUser` ya usa
   * para el email de verificación.
   */
  private sendSecurityEmail(
    to: string,
    emailType: EmailTypeEnum,
    user: Users,
  ): void {
    void (async () => {
      try {
        await this.emailService.sendEmailByType(to, emailType, user);
      } catch (error) {
        this.logger.error(
          `Error enviando el aviso de seguridad ${emailType} a ${to}: ${String(error)}`,
        );
      }
    })();
  }

  /**
   * Clave pública RSA (PEM) para que un cliente sin servidor propio (mobile) pueda cifrar el
   * login sin llevarla hardcodeada — ver `PublicKeyResponseDTO`.
   */
  publicKey(): DTO.PublicKeyResponseDTO {
    return { publicKeyPem: this.configService.authentication.publicKey };
  }

  /**
   * `avatarKey` es la key de S3 (permanente); acá se resuelve a una URL presignada fresca (expira
   * en 900s) en el momento de la respuesta — nunca se persiste ni cachea esta URL.
   */
  private resolveAvatarUrl(avatarKey: string | null): Promise<string | null> {
    if (!avatarKey) return Promise.resolve(null);
    return this.uploadsService.getPresignedUrl(avatarKey);
  }

  async handleLogin(
    dto: DTO.LoginUserDTO,
    userAgent?: string,
  ): Promise<DTO.LoginUserResponseDTO> {
    const loginResult = await this.authService.login({
      email: dto.email,
      encryptedPassword: dto.encryptedPassword,
      userAgent,
      rembemberMe: dto.rememberMe,
    });

    if (loginResult.success) {
      // Tarea 6: aviso de seguridad de "nuevo inicio de sesión" — no bloquea la respuesta del
      // login (fire-and-forget vía sendSecurityEmail).
      if (loginResult.user) {
        this.sendSecurityEmail(
          loginResult.user.email,
          EmailTypeEnum.LOGIN,
          loginResult.user,
        );
      }
      return {
        login: true,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        requiredNewPassword: false,
      };
    }

    if (loginResult.requiresPasswordCreation) {
      return { login: false, requiredNewPassword: true };
    }

    return { login: false, requiredNewPassword: false };
  }

  async createPasswordWithToken(dto: DTO.CreatePasswordDTO): Promise<{
    success: boolean;
    message: string;
  }> {
    this.authMigrationService.verifyTempToken(dto.token, dto.email);
    return await this.authService.createPassword({
      email: dto.email,
      encryptedPassword: dto.encryptedPassword,
    });
  }

  async updatePassword(
    dto: DTO.UpdateUserPasswordDTO,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.changePassword(dto);
    // Tarea 6: confirmación de "tu contraseña cambió" — si no fue el usuario, tiene rastro.
    this.sendSecurityEmail(
      result.user.email,
      EmailTypeEnum.PASSWORD_CHANGED,
      result.user,
    );
    return result;
  }

  async changeExpiredPassword(
    dto: DTO.ChangeExpiredPasswordDTO,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.changeExpiredPassword(dto);
    this.sendSecurityEmail(
      result.user.email,
      EmailTypeEnum.PASSWORD_CHANGED,
      result.user,
    );
    return result;
  }

  async generateNonce(): Promise<DTO.NonceResponseDTO> {
    return await this.authService.generateNonce();
  }

  me(user: IUserDataOnJwt): DTO.MeResponseDTO {
    return {
      id: user.referenceId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.userStatus,
      profileStatus: user.profileStatus,
      accessLevelId: user.accessLevelId,
      roles: user.roles,
      permissions: user.permissions,
    };
  }

  /**
   * Autoedición de perfil — el propio usuario actualiza sus datos básicos (nunca email, status,
   * ni nada administrativo, ver `UpdateMeRequestDTO`). No requiere `USER.UPDATE`: la propiedad
   * viene de `user.id` (JWT), no de un permiso.
   */
  async updateMe(
    user: IUserDataOnJwt,
    dto: DTO.UpdateMeRequestDTO,
  ): Promise<DTO.MeResponseDTO> {
    const updated = await this.userService.updateUser(
      user.id,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        avatarKey: dto.avatarKey,
        shareContactInfo: dto.shareContactInfo,
      },
      user.email,
    );

    return {
      id: updated.referenceId,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      avatarUrl: await this.resolveAvatarUrl(updated.avatarKey),
      status: updated.status,
      profileStatus: updated.profileStatus,
      accessLevelId: updated.accessLevelId,
      roles: user.roles,
      permissions: user.permissions,
      shareContactInfo: updated.shareContactInfo,
    };
  }

  async forgotPassword(
    dto: DTO.ForgotUserPasswordDTO,
  ): Promise<{ success: boolean; message: string }> {
    const email = this.authMigrationService.verifyForgotPasswordToken(
      dto.token,
    );
    const result = await this.authService.resetPassword({
      email,
      encryptedNewPassword: dto.encryptedNewPassword,
      encryptedConfirmPassword: dto.encryptedConfirmPassword,
    });
    // Tarea 6: confirmación de que el reseteo se completó — distinto del email FORGOT_PASSWORD
    // que ya se manda en la SOLICITUD del reseteo (sendPasswordResetEmail, más abajo en este
    // mismo archivo), no en la finalización.
    this.sendSecurityEmail(
      result.user.email,
      EmailTypeEnum.PASSWORD_RESET,
      result.user,
    );
    return result;
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
  }> {
    return await this.authService.refreshAccessToken(refreshToken);
  }

  async scope(user: IUserDataOnJwt): Promise<DTO.UserScopeResponseDTO> {
    const [fullUser, { roles, permissions }] = await Promise.all([
      this.userService.findUserById(user.id),
      this.authService.getUserScope(user.id),
    ]);
    const avatarUrl = await this.resolveAvatarUrl(fullUser.avatarKey);

    return {
      user: {
        id: fullUser.referenceId,
        email: fullUser.email,
        phoneNumber: fullUser.phoneNumber,
        avatarUrl,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        status: fullUser.status,
        profileStatus: fullUser.profileStatus,
        accessLevelId: fullUser.accessLevelId,
        isEmployee: fullUser.isEmployee,
        // I-01 (borrado de cuenta): fresco desde DB — a diferencia de `me()` (GET /auth/me), que
        // solo ecoa el JWT y quedaría desactualizado durante la ventana de gracia (el JWT no se
        // reemite al pedir/cancelar el borrado). Este endpoint ya hace un `findUserById` propio,
        // no es una consulta nueva.
        deletionScheduledAt: fullUser.deletionScheduledAt,
      },
      roles,
      permissions,
    };
  }

  async userVerify(user: Users): Promise<void> {
    await this.authService.verifyUser(user.id);
  }

  async userVerificationStatus(
    user: Users,
  ): Promise<{ verified: boolean; email: string }> {
    return await this.authService.checkVerificationStatus(user);
  }

  async sendVerificationEmail(to: string, user: Users): Promise<void> {
    await this.emailService.sendEmailByType(
      to,
      EmailTypeEnum.VERIFICATION,
      user,
    );
  }

  async sendPasswordResetEmail(to: string, user: Users): Promise<void> {
    await this.emailService.sendEmailByType(
      to,
      EmailTypeEnum.FORGOT_PASSWORD,
      user,
      '24h',
    );
  }

  async sendPasswordCreationEmail(to: string, user: Users): Promise<void> {
    await this.emailService.sendEmailByType(
      to,
      EmailTypeEnum.CREATE_PASSWORD,
      user,
    );
  }
}
