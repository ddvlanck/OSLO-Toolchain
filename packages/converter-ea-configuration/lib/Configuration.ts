export class Configuration {
  public readonly diagramName: string;
  public readonly umlFile: string;
  public readonly specificationType: string;

  public constructor(umlFile: string, diagramName: string, specificationType: string) {
    this.umlFile = umlFile;
    this.diagramName = diagramName;
    this.specificationType = specificationType;
  }
}
