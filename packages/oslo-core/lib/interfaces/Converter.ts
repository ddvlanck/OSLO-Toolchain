import type { Logger } from '../logging/Logger';
import type { OutputHandler } from './OutputHandler';

export abstract class Converter<T> {
  private _logger: Logger | undefined;
  private _configuration: T | undefined;
  private _outputHandler: OutputHandler | undefined;

  public init(config: T, outputHandler: OutputHandler, logger: Logger): void {
    this._configuration = config;
    this._outputHandler = outputHandler;
    this._logger = logger;
  }

  public get configuration(): T {
    if (!this._configuration) {
      throw new Error('Configuration not set yet.');
    }
    return this._configuration;
  }

  public get outputHandler(): OutputHandler {
    if (!this._outputHandler) {
      throw new Error('OutputHandler not set yet.');
    }
    return this._outputHandler;
  }

  public get logger(): Logger {
    if (!this._logger) {
      throw new Error('Logger not set yet.');
    }
    return this._logger;
  }

  public abstract convert(): Promise<void>;
}
