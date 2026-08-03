import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

import { t } from '@common/i18n/i18n.helper';

@ValidatorConstraint({ name: 'maxCommaSeparated', async: false })
export class MaxCommaSeparatedConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments) {
    if (typeof value !== 'string') return false;

    const max = args.constraints[0] as number;
    const rawValue = value.trim();

    if (rawValue.length === 0) return false;

    const parts = rawValue.split(',').filter((part) => part.trim().length > 0);
    return parts.length <= max;
  }

  defaultMessage(args: ValidationArguments) {
    const max = args.constraints[0] as number;
    return t('validation.MAX_COMMA_SEPARATED', {
      property: args.property,
      max,
    });
  }
}
