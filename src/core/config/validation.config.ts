import { ValidationPipeOptions } from '@nestjs/common';
import { ValidationError } from 'class-validator';

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
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          value: error.value as unknown,
          constraints: error.constraints,
          children:
            error.children && error.children.length > 0
              ? error.children
              : undefined,
        }));

        return {
          statusCode: 422,
          message: 'Error de validación',
          errors: formattedErrors,
          timestamp: new Date().toISOString(),
        };
      },
    };
  }

  static getValidationRules(): Record<string, ValidationRuleItem> {
    return {
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'El formato del email no es válido',
      },
      password: {
        minLength: 8,
        maxLength: 128,
        pattern:
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        message:
          'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
      },
      phone: {
        pattern: /^\+?[1-9]\d{1,14}$/,
        message: 'El formato del número de teléfono no es válido',
      },
      latitude: {
        min: -90,
        max: 90,
        message: 'La latitud debe estar entre -90 y 90',
      },
      longitude: {
        min: -180,
        max: 180,
        message: 'La longitud debe estar entre -180 y 180',
      },
      price: {
        min: 0,
        precision: 2,
        message: 'El precio debe ser mayor a 0 y tener máximo 2 decimales',
      },
      rating: {
        min: 1,
        max: 5,
        message: 'La calificación debe estar entre 1 y 5',
      },
      name: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        message:
          'El nombre debe tener entre 2 y 50 caracteres y solo puede contener letras y espacios',
      },
      description: {
        minLength: 10,
        maxLength: 1000,
        message: 'La descripción debe tener entre 10 y 1000 caracteres',
      },
      url: {
        pattern:
          /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
        message: 'La URL no tiene un formato válido',
      },
      uuid: {
        pattern:
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        message: 'El UUID no tiene un formato válido',
      },
    };
  }

  static getCustomMessages(): Record<string, string> {
    return {
      isNotEmpty: 'El campo no puede estar vacío',
      isString: 'El campo debe ser una cadena de texto',
      isNumber: 'El campo debe ser un número',
      isBoolean: 'El campo debe ser un valor booleano',
      isDate: 'El campo debe ser una fecha válida',
      isArray: 'El campo debe ser un array',
      isObject: 'El campo debe ser un objeto',
      isEmail: 'El campo debe ser un email válido',
      isUrl: 'El campo debe ser una URL válida',
      isUuid: 'El campo debe ser un UUID válido',
      minLength: 'El campo debe tener al menos $constraint1 caracteres',
      maxLength: 'El campo debe tener máximo $constraint1 caracteres',
      min: 'El valor mínimo permitido es $constraint1',
      max: 'El valor máximo permitido es $constraint1',
      isPositive: 'El valor debe ser positivo',
      isNegative: 'El valor debe ser negativo',
      isInt: 'El valor debe ser un número entero',
      isFloat: 'El valor debe ser un número decimal',
      isDateString: 'El campo debe ser una fecha válida en formato ISO',
      isEnum: 'El valor debe ser uno de los siguientes: $constraint1',
      isArrayNotEmpty: 'El array no puede estar vacío',
      arrayMinSize: 'El array debe tener al menos $constraint1 elementos',
      arrayMaxSize: 'El array debe tener máximo $constraint1 elementos',
    };
  }
}
