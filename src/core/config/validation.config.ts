import { ValidationPipeOptions } from '@nestjs/common';
import { ValidationError } from 'class-validator';

import { t, translateValidationConstraints } from '@common/i18n/i18n.helper';

export interface ValidationRuleItem {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  precision?: number;
  message: string;
}

interface ValidationPipeOptionsExtended extends ValidationPipeOptions {
  skipEmptyValues?: boolean;
}

export class ValidationConfig {
  static getValidationOptions(): ValidationPipeOptionsExtended {
    return {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validateCustomDecorators: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      skipEmptyValues: false,
      errorHttpStatusCode: 422,
      // Los mensajes producidos por `i18nValidationMessage()` llegan acá como
      // `clave|{args}` y se resuelven al idioma del request; los mensajes por
      // defecto de `class-validator` pasan sin tocar.
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          value: error.value as unknown,
          constraints: translateValidationConstraints(error.constraints),
          children:
            error.children && error.children.length > 0
              ? ValidationConfig.translateChildren(error.children)
              : undefined,
        }));

        return {
          statusCode: 422,
          message: t('validation.VALIDATION_ERROR'),
          errors: formattedErrors,
          timestamp: new Date().toISOString(),
        };
      },
    };
  }

  /** Traduce recursivamente los `constraints` de los errores anidados. */
  private static translateChildren(
    children: ValidationError[],
  ): ValidationError[] {
    return children.map((child) => ({
      ...child,
      constraints: translateValidationConstraints(child.constraints),
      children:
        child.children && child.children.length > 0
          ? ValidationConfig.translateChildren(child.children)
          : child.children,
    }));
  }

  static getValidationRules(): Record<string, ValidationRuleItem> {
    return {
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: t('validation.EMAIL_FORMAT_INVALID'),
      },
      password: {
        minLength: 8,
        maxLength: 128,
        pattern:
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        message: t('validation.PASSWORD_POLICY'),
      },
      phone: {
        pattern: /^\+?[1-9]\d{1,14}$/,
        message: t('validation.PHONE_FORMAT_INVALID'),
      },
      latitude: {
        min: -90,
        max: 90,
        message: t('validation.LATITUDE_RANGE'),
      },
      longitude: {
        min: -180,
        max: 180,
        message: t('validation.LONGITUDE_RANGE'),
      },
      price: {
        min: 0,
        precision: 2,
        message: t('validation.PRICE_INVALID'),
      },
      rating: {
        min: 1,
        max: 5,
        message: t('validation.RATING_RANGE'),
      },
      name: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        message: t('validation.NAME_FORMAT'),
      },
      description: {
        minLength: 10,
        maxLength: 1000,
        message: t('validation.DESCRIPTION_LENGTH'),
      },
      url: {
        pattern:
          /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
        message: t('validation.URL_FORMAT_INVALID'),
      },
      uuid: {
        pattern:
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        message: t('validation.UUID_FORMAT_INVALID'),
      },
    };
  }

  static getCustomMessages(): Record<string, string> {
    return {
      isNotEmpty: t('validation.FIELD_NOT_EMPTY'),
      isString: t('validation.FIELD_MUST_BE_STRING'),
      isNumber: t('validation.FIELD_MUST_BE_NUMBER'),
      isBoolean: t('validation.FIELD_MUST_BE_BOOLEAN'),
      isDate: t('validation.FIELD_MUST_BE_DATE'),
      isArray: t('validation.FIELD_MUST_BE_ARRAY'),
      isObject: t('validation.FIELD_MUST_BE_OBJECT'),
      isEmail: t('validation.FIELD_MUST_BE_EMAIL'),
      isUrl: t('validation.FIELD_MUST_BE_URL'),
      isUuid: t('validation.FIELD_MUST_BE_UUID'),
      minLength: t('validation.MIN_LENGTH'),
      maxLength: t('validation.MAX_LENGTH'),
      min: t('validation.MIN_VALUE'),
      max: t('validation.MAX_VALUE'),
      isPositive: t('validation.VALUE_MUST_BE_POSITIVE'),
      isNegative: t('validation.VALUE_MUST_BE_NEGATIVE'),
      isInt: t('validation.VALUE_MUST_BE_INT'),
      isFloat: t('validation.VALUE_MUST_BE_FLOAT'),
      isDateString: t('validation.FIELD_MUST_BE_ISO_DATE'),
      isEnum: t('validation.ONE_OF_VALUES'),
      isArrayNotEmpty: t('validation.ARRAY_NOT_EMPTY'),
      arrayMinSize: t('validation.ARRAY_MIN_SIZE'),
      arrayMaxSize: t('validation.ARRAY_MAX_SIZE'),
    };
  }
}
