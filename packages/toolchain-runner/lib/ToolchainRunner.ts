import type { Converter } from '@oslo-flanders/types';

export class ToolchainRunner {
  private readonly converter: Converter;

  public constructor(converter: Converter) {
    this.converter = converter;
  }

  public async start(): Promise<void> {
    await this.converter.convert();
  }
}
