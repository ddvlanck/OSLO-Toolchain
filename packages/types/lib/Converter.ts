import type { OutputHandler } from './OutputHandler';

// FIXME: outputHandler is optional for now (easier to test in the config.jsonld)

export abstract class Converter {
  private readonly umlFile: string;
  private readonly outputHandler: OutputHandler | undefined;

  public constructor(umlFile: string, outputHandler?: OutputHandler) {
    this.umlFile = umlFile;
    this.outputHandler = outputHandler;
  }

  // TODO: return type should be an OSLO Document
  public abstract convert(): any;
}
