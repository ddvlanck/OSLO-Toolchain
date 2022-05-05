export class Configuration {
  public readonly diagramName: string;
  public readonly umlFile: string;
  public readonly specificationType: string;
  public readonly outputFile: string;

  public constructor(umlFile: string, diagramName: string, outputFile: string, specificationType: string) {
    this.umlFile = umlFile;
    this.diagramName = diagramName;
    this.outputFile = outputFile;
    this.specificationType = specificationType;
  }
}
