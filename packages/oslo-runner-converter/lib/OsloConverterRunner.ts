import type { EaConverterConfiguration } from '@oslo-flanders/configuration';
import type { Converter, OutputHandler, Runner } from '@oslo-flanders/core';
import { getLoggerFor } from '@oslo-flanders/core';
import { EaConverter, JsonLdOutputHandler } from '@oslo-flanders/ea-to-rdf-converter';

export class OsloConverterRunner implements Omit<Runner<EaConverterConfiguration>, 'generators'> {
  public readonly logger = getLoggerFor(this);
  public readonly configuration: EaConverterConfiguration;
  public readonly converter: Converter<EaConverterConfiguration>;
  public readonly converterOutputHandler: OutputHandler;

  public constructor(configuration: EaConverterConfiguration) {
    this.configuration = configuration;
    this.converter = new EaConverter();
    this.converterOutputHandler = new JsonLdOutputHandler();
  }

  public async init(): Promise<void> {
    this.converter.init(
      this.configuration,
      this.converterOutputHandler,
      this.logger,
    );
  }

  public async start(): Promise<void> {
    await this.converter.convert();
  }
}
