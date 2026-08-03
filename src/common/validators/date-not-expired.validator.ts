import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

import { t } from '@common/i18n/i18n.helper';

@ValidatorConstraint({ name: 'notExpired', async: false })
export class NotExpiredConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    console.debug(`Argumentos de la validación ${JSON.stringify(args)}`);

    if (!value) return true; // Permitir nulos si el campo es opcional
    const date = new Date(value);
    const now = new Date();
    // La fecha debe ser mayor o igual a la actual
    return date.getTime() >= now.getTime();
  }

  defaultMessage(args: ValidationArguments) {
    return t('validation.DATE_NOT_EXPIRED', { property: args.property });
  }
}

export function NotExpired(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NotExpiredConstraint,
    });
  };
}
