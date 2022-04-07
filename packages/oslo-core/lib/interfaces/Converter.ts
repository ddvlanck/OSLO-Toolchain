import type { OutputHandler } from './OutputHandler';

// FIXME: outputHandler is optional for now (easier to test in the config.jsonld)

export abstract class Converter {
  private readonly umlFile: string;
  public readonly outputHandler: OutputHandler;

  public constructor(umlFile: string, outputHandler: OutputHandler) {
    this.umlFile = umlFile;
    this.outputHandler = outputHandler;
  }

  // TODO: return type should be an OSLO Document
  public abstract convert(): void;
}
