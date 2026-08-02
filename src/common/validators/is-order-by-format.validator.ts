import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { t } from '@common/i18n/i18n.helper';

export type SortDirection = 'desc' | 'asc';

@ValidatorConstraint({ name: 'isOrderByFormat', async: false })
export class IsOrderByFormat implements ValidatorConstraintInterface {
  validate(value: string) {
    if (typeof value !== 'string') return false;
    const [field, direction] = value.split(':');
    return Boolean(field) && ['asc', 'desc'].includes(direction.toLowerCase());
  }

  defaultMessage() {
    return t('validation.ORDER_BY_FORMAT');
  }
}
