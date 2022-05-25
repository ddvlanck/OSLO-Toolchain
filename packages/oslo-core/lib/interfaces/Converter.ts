import { getLoggerFor } from '../logging/LogUtil';
import type { OutputHandler } from './OutputHandler';

/**
 * Class that handles the conversion of a UML model to an RDF file.
 */
// Does not contain a constructor to keep componentsjs config file as simple as possible
export abstract class Converter<T> {
  protected readonly logger = getLoggerFor(this);

  private _configuration: T | undefined;
  private _outputHandler: OutputHandler | undefined;

  public init(config: T, outputHandler: OutputHandler): void {
    this.logger.info(`Received following configuration from runner: ${JSON.stringify(config)}`);
    this._configuration = config;
    this._outputHandler = outputHandler;
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

  public abstract convert(): Promise<void>;
}
