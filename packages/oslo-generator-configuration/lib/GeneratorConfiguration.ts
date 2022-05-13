export class GeneratorConfiguration {
  public file: string;
  public outputFile: string;

  public constructor(file: string, outputFile: string) {
    this.file = file;
    this.outputFile = outputFile;
  }
}
