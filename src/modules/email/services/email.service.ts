import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailHelper } from '@modules/email/helpers/email.helper';
import { ISendEmailOptions } from '@modules/email/interfaces/email.interface';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { ConfigType } from '@nestjs/config';
import { Users } from '@prisma/client';
import { EmailTypeEnum } from '@modules/email/enum/email-type.enum';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(APP_CONFIG.KEY)
    private configService: ConfigType<AppConfigType>,
  ) {
    this.initializeTransporter();
  }

  /**
   * Inicializa el transporter de nodemailer con la configuración del servicio de correo.
   * @remarks
   * Esta función configura el transporter utilizando los parámetros definidos en la configuración
   * de la aplicación, como el host, puerto, usuario y contraseña del servidor SMTP.
   * @returns void
   * @throws Error si la configuración del correo es inválida.
   */
  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.email.host,
      port: this.configService.email.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.email.user,
        pass: this.configService.email.password,
      },
    });
  }

  /**
   * Función que se encarga del envio de correo.
   * @param ISendEmailOptions Objeto que contiene: to (a quien), subject (asunto), content (contenido del correo).
   * @throws InternalServerErrorException si ocurre un error al enviar el correo.
   * @remarks
   * Este método utiliza nodemailer para enviar un correo electrónico con el contenido enviado
   * @returns void
   */
  async send({ to, subject, content }: ISendEmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `Soporte <${this.configService.email.dir}>`,
        to: to,
        subject: subject,
        html: content,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Correo enviado a: ${to}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al enviar el correo a ${to}: ${errorMessage}`);
      throw new InternalServerErrorException(
        t('email.SET_PASSWORD_SEND_ERROR'),
      );
    }
  }

  /**
   * Envía un correo electrónico basado en el tipo especificado.
   * @param to Dirección de correo del destinatario.
   * @param emailType Tipo de correo a enviar (por ejemplo, 'VERIFICATION').
   * @param user Usuario.
   * @throws NotFoundException si el usuario no es encontrado o está inactivo.
   * @throws InternalServerErrorException si el tipo de correo no es reconocido.
   * @remarks
   * Este método maneja diferentes tipos de correos electrónicos. Actualmente, soporta
   * el envío de correos de verificación de usuario, generando un token temporal y
   * utilizando el servicio de usuarios para obtener la información necesaria.
   * El correo incluye una plantilla HTML personalizada.
   * @returns void
   */
  async sendEmailByType(
    to: string,
    emailType: EmailTypeEnum,
    user?: Users,
    tokenExpiresOverride?: string,
    extraData?: { dto: Record<string, unknown>; description: string },
  ): Promise<void> {
    if (extraData) {
      this.logger.debug(
        `Datos adicionales para el correo: ${extraData.description} - ${JSON.stringify(extraData.dto)}`,
      );
    }
    switch (emailType) {
      case EmailTypeEnum.VERIFICATION: {
        if (!user) {
          this.logger.warn(`Usuario con email ${to} no encontrado o inactivo.`);
          throw new NotFoundException(t('email.USER_NOT_FOUND_OR_INACTIVE'));
        }

        const tempToken = CryptoHelper.generateToken(
          'tempToken',
          {
            sub: String(user.id),
            email: user.email,
            user: user,
          },
          'RS256',
          this.configService.authentication.tempTokenExpires,
        );

        const userVerificationLink = `${this.configService.baseUrl}/auth/verify-email/confirm?email=${to}&token=${tempToken}`;
        await this.send({
          to,
          subject: 'Verificación de correo',
          content: EmailHelper.createUserVerificationTemplate(
            user.firstName + ' ' + user.lastName,
            userVerificationLink,
          ),
        });
        break;
      }
      case EmailTypeEnum.FORGOT_PASSWORD: {
        if (!user) {
          this.logger.warn(`Usuario con email ${to} no encontrado o inactivo.`);
          throw new NotFoundException(t('email.USER_NOT_FOUND_OR_INACTIVE'));
        }

        const tempToken = CryptoHelper.generateToken(
          'tempToken',
          {
            sub: String(user.id),
            email: user.email,
            action: 'forgotPassword',
          },
          'RS256',
          tokenExpiresOverride ??
            this.configService.authentication.tempTokenExpires,
        );

        const forgotPasswordLink = `${this.configService.baseUrl}/auth/reset-password?token=${tempToken}&email=${encodeURIComponent(to)}`;
        await this.send({
          to,
          subject: 'Olvide mi contraseña',
          content: EmailHelper.createUserForgotPasswordTemplate(
            user.firstName + ' ' + user.lastName,
            forgotPasswordLink,
          ),
        });
        break;
      }
      case EmailTypeEnum.CREATE_PASSWORD: {
        if (!user) {
          this.logger.warn(`Usuario con email ${to} no encontrado o inactivo.`);
          throw new NotFoundException(t('email.USER_NOT_FOUND_OR_INACTIVE'));
        }

        const tempToken = CryptoHelper.generateToken(
          'tempToken',
          {
            sub: String(user.id),
            email: user.email,
          },
          'RS256',
          this.configService.authentication.tempTokenExpires,
        );

        const createPasswordLink = `${this.configService.baseUrl}/auth/set-password?email=${to}&token=${tempToken}`;

        await this.send({
          to,
          subject: 'Creá tu contraseña',
          content: EmailHelper.createPasswordCreationTemplate(
            user.firstName + ' ' + user.lastName,
            createPasswordLink,
          ),
        });
        break;
      }

      // Tarea 6 (platform-hardening-2026-09, 2026-09-14): avisos de seguridad — reusan
      // `createGenericNotificationTemplate` (I-05) en vez de una plantilla propia por evento,
      // porque ninguno lleva un link de acción (a diferencia de VERIFICATION/FORGOT_PASSWORD/
      // CREATE_PASSWORD, que sí son botón-con-token).
      case EmailTypeEnum.LOGIN: {
        if (!user) {
          this.logger.warn(`Usuario con email ${to} no encontrado o inactivo.`);
          throw new NotFoundException(t('email.USER_NOT_FOUND_OR_INACTIVE'));
        }
        await this.send({
          to,
          subject: 'Nuevo inicio de sesión',
          content: EmailHelper.createGenericNotificationTemplate(
            `${user.firstName} ${user.lastName}`,
            'Nuevo inicio de sesión',
            'Detectamos un inicio de sesión en tu cuenta. Si fuiste vos, no necesitás hacer nada.',
          ),
        });
        break;
      }

      case EmailTypeEnum.PASSWORD_CHANGED: {
        if (!user) {
          this.logger.warn(`Usuario con email ${to} no encontrado o inactivo.`);
          throw new NotFoundException(t('email.USER_NOT_FOUND_OR_INACTIVE'));
        }
        await this.send({
          to,
          subject: 'Tu contraseña cambió',
          content: EmailHelper.createGenericNotificationTemplate(
            `${user.firstName} ${user.lastName}`,
            'Tu contraseña cambió',
            'Confirmamos que la contraseña de tu cuenta fue actualizada. Si no fuiste vos, contactanos de inmediato.',
          ),
        });
        break;
      }

      case EmailTypeEnum.PASSWORD_RESET: {
        if (!user) {
          this.logger.warn(`Usuario con email ${to} no encontrado o inactivo.`);
          throw new NotFoundException(t('email.USER_NOT_FOUND_OR_INACTIVE'));
        }
        await this.send({
          to,
          subject: 'Tu contraseña fue restablecida',
          content: EmailHelper.createGenericNotificationTemplate(
            `${user.firstName} ${user.lastName}`,
            'Tu contraseña fue restablecida',
            'Tu contraseña se restableció correctamente. Si no fuiste vos, contactanos de inmediato.',
          ),
        });
        break;
      }

      case EmailTypeEnum.PAYMENT_METHOD_CREATED: {
        if (!user) {
          this.logger.warn(`Usuario con email ${to} no encontrado o inactivo.`);
          throw new NotFoundException(t('email.USER_NOT_FOUND_OR_INACTIVE'));
        }
        const methodLabel =
          typeof extraData?.dto?.methodLabel === 'string'
            ? extraData.dto.methodLabel
            : undefined;
        await this.send({
          to,
          subject: 'Agregaste un nuevo medio de pago',
          content: EmailHelper.createGenericNotificationTemplate(
            `${user.firstName} ${user.lastName}`,
            'Medio de pago agregado',
            methodLabel
              ? `Agregaste ${methodLabel} como medio de pago.`
              : 'Agregaste un nuevo medio de pago a tu cuenta.',
          ),
        });
        break;
      }

      // Comprobante de pago (I-05/tarea 6): el switch queda listo, pero HOY no hay ningún
      // llamador real — `PaymentStatus.COMPLETED` no tiene ningún escritor en el código
      // (bloqueado por I-02/0014-dinelco-checkout-integration, mismo motivo que dejó
      // `PAYMENT_RECEIVED` sin implementar en la spec de notificaciones I-05). Se deja
      // enganchado (no solo declarado) para no repetir este trabajo cuando el pago real exista.
      case EmailTypeEnum.PAYMENT_RECEIPT: {
        if (!user) {
          this.logger.warn(`Usuario con email ${to} no encontrado o inactivo.`);
          throw new NotFoundException(t('email.USER_NOT_FOUND_OR_INACTIVE'));
        }
        const receipt = extraData?.dto as
          | {
              operationNumber: string;
              authorizationCode: string;
              merchantName: string;
              transactionDate: string;
              amount: number | string;
              paymentMethod: string;
              description: string;
            }
          | undefined;
        if (!receipt) {
          throw new InternalServerErrorException(
            t('email.PAYMENT_RECEIPT_DATA_REQUIRED'),
          );
        }
        await this.send({
          to,
          subject: 'Comprobante de pago',
          content: EmailHelper.createPaymentReceiptTemplate(
            receipt.operationNumber,
            receipt.authorizationCode,
            receipt.merchantName,
            receipt.transactionDate,
            receipt.amount,
            receipt.paymentMethod,
            receipt.description,
          ),
        });
        break;
      }

      default: {
        this.logger.warn(`Tipo de email no reconocido`);
        throw new InternalServerErrorException(t('email.UNKNOWN_EMAIL_TYPE'));
      }
    }
  }
}
