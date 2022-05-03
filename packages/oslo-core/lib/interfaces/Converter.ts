import type { OutputHandler } from './OutputHandler';

export abstract class Converter {
  private readonly umlFile: string;
  public readonly outputHandler: OutputHandler;

  public constructor(umlFile: string, outputHandler: OutputHandler) {
    this.umlFile = umlFile;
    this.outputHandler = outputHandler;
  }

  public abstract convert(): void;
}
