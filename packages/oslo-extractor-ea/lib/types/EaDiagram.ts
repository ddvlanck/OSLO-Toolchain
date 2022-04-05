import { EaObject } from './Object';

/**
 * Represents a diagram in Enterprise Architect
 */
export class EaDiagram extends EaObject {
  public readonly packageId: number;
  public connectorsIds: number[];
  public elementIds: number[];
  private _path: string | undefined;

  public constructor(
    id: number,
    guid: string,
    name: string,
    packageId: number,
  ) {
    super(id, guid, name);

    this.packageId = packageId;
    this.connectorsIds = [];
    this.elementIds = [];
  }

  public path(): string {
    if (!this._path) {
      // Log error
      return this.name;
    }

    return this._path;
  }

  public setPath(path: string): void {
    this._path = path;
  }
}
