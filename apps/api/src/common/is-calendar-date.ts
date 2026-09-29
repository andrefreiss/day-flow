import {
  buildMessage,
  ValidateBy,
  type ValidationOptions,
} from 'class-validator';
import { fromDateColumn, toDateColumn } from './date-column.js';

const calendarDateFormat = /^\d{4}-\d{2}-\d{2}$/;

export function isCalendarDate(value: unknown): boolean {
  if (typeof value !== 'string' || !calendarDateFormat.test(value)) {
    return false;
  }

  const date = toDateColumn(value);

  return !Number.isNaN(date.getTime()) && fromDateColumn(date) === value;
}

export function IsCalendarDate(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCalendarDate',
      validator: {
        validate: isCalendarDate,
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property deve ser uma data válida no formato YYYY-MM-DD`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
