import type { Logger as WinstonLogger } from 'winston';
import { createLogger, transports, format } from 'winston';

/**
 * Logs messages on a certain level by using the Winston logger.
 *
 */

export class Logger {
  private readonly logger: WinstonLogger;
  private readonly label: string;

  public constructor(label: string) {
    this.logger = this.createWinstonLogger(label);
    this.label = label;
  }

  public log(level: string, message: string, meta?: any): WinstonLogger {
    return this.logger.log(level, message, meta);
  }

  /**
   * Logs a message at the 'error' level
   * @param message - The message to log
   */
  public error(message: string, meta?: any): WinstonLogger {
    return this.log('error', message, meta);
  }

  /**
   * Logs a message at the 'warn' level
   * @param message - The message to log
   */
  public warn(message: string, meta?: any): WinstonLogger {
    return this.log('warn', message, meta);
  }

  /**
   * Logs a message at the 'info' level
   * @param message - The message to log
   */
  public info(message: string, meta?: any): WinstonLogger {
    return this.log('info', message, meta);
  }

  /**
   * Logs a message at the 'debug' level
   * @param message - The message to log
   */
  public debug(message: string, meta?: any): WinstonLogger {
    return this.log('debug', message, meta);
  }

  private createWinstonLogger(label: string): WinstonLogger {
    const fileLogFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp} [${level}] : ${message} `;
      if (Object.keys(metadata).length > 0) {
        msg += `${JSON.stringify(metadata, null, 4)}`;
      }
      return msg;
    });

    // TODO: this should not be here
    const silent = process.env.NODE_ENV === 'test';

    return createLogger({
      transports: [
        new transports.Console({
          silent,
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
        }),
        new transports.File({
          filename: `toolchain-debug-info.log`,
          options: { flags: 'w' },
          level: 'debug',
          format: format.combine(
            format.timestamp(),
            fileLogFormat,
          ),
        }),
      ],
    });
  }
}
