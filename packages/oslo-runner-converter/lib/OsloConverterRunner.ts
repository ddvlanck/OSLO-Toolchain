import type { Converter, OutputHandler, Runner } from '@oslo-flanders/core';

export class OsloConverterRunner<T> implements Partial<Runner<T>> {
  public readonly configuration: T;
  public readonly converter: Converter<T>;
  public readonly converterOutputHandler: OutputHandler;

  public constructor(configuration: T, converter: Converter<T>, outputHandler: OutputHandler) {
    this.configuration = configuration;
    this.converter = converter;
    this.converterOutputHandler = outputHandler;
  }

  public async start(): Promise<void> {
    this.converter.init(this.configuration, this.converterOutputHandler);
    await this.converter.convert();
  }
}
