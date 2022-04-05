import { EaObject } from './Object';

/**
 * Represents an attribute in Enterprise Architect
 */
export class EaAttribute extends EaObject {
  public readonly classId: number;
  public readonly type: string;
  public readonly lowerBound: string;
  public readonly upperBound: string;
  private _path: string | undefined;

  public constructor(
    id: number,
    guid: string,
    name: string,
    classId: number,
    type: string,
    lowerBound: string,
    upperBound: string,
  ) {
    super(id, guid, name);

    this.classId = classId;
    this.type = type;
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
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
