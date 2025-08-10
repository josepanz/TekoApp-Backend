import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export class LoggerConfig {
  static createLogger(): LoggerService {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    const transports = [
      // Consola para desarrollo
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    ];

    // Agregar archivo de logs en producción
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new DailyRotateFile({
          filename: 'logs/tekoapp-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      );
    }

    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports,
      exitOnError: false,
    });

    return {
      log: (message: string, context?: string) => {
        logger.info(message, { context });
      },
      error: (message: string, trace?: string, context?: string) => {
        logger.error(message, { trace, context });
      },
      warn: (message: string, context?: string) => {
        logger.warn(message, { context });
      },
      debug: (message: string, context?: string) => {
        logger.debug(message, { context });
      },
      verbose: (message: string, context?: string) => {
        logger.verbose(message, { context });
      },
    };
  }
}
