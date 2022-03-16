import type { Logger as WinstonLogger } from 'winston';
import { createLogger, transports, format } from 'winston';

/**
 * Logs messages on a certain level by using the Winston logger.
 *
 */
export class Logger {
  private static instance: Logger;

  private readonly logger: WinstonLogger;

  private constructor(loggable: Instance | string) {
    this.logger = this.createLogger(loggable);
  }

  public static getInstanceFor(loggable: Instance | string): Logger {
    if (!this.instance) {
      Logger.instance = new Logger(loggable);
    }

    return Logger.instance;
  }

  /**
   * Logs a message at the 'error' level
   * @param message - The message to log
   */
  public error(message: string): WinstonLogger {
    return this.logger.error(message);
  }

  /**
   * Logs a message at the 'warn' level
   * @param message - The message to log
   */
  public warn(message: string): WinstonLogger {
    return this.logger.warn(message);
  }

  /**
   * Logs a message at the 'info' level
   * @param message - The message to log
   */
  public info(message: string): WinstonLogger {
    return this.logger.info(message);
  }

  /**
   * Logs a message at the 'debug' level
   * @param message - The message to log
   */
  public debug(message: string): WinstonLogger {
    return this.logger.debug(message);
  }

  private createLogger(loggable: Instance | string): WinstonLogger {
    const label = typeof loggable === 'string' ? loggable : loggable.constructor.name;

    return createLogger({
      transports: [
        new transports.Console(),
      ],
      format: format.combine(
        format.colorize(),
        format.label({ label }),
        format.timestamp(),
        format.printf(({
          level: levelInner,
          message,
          label: labelInner,
          timestamp,
        }: Record<string, any>): string =>
          `${timestamp} [${labelInner}] ${levelInner}: ${message}`),
      ),
    });
  }
}

interface Instance {
  constructor: { name: string };
}
