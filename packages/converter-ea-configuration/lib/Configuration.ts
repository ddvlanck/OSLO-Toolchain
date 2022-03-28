export class Configuration {
  public readonly diagramName: string;
  public readonly umlFile: string;

  public constructor(umlFile: string, diagramName: string) {
    this.umlFile = umlFile;
    this.diagramName = diagramName;
  }
}
