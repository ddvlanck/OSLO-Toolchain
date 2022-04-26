import { EaObject } from './Object';

/**
 * Enumeration to reference the element type
 */
export enum ElementType {
  Class,
  DataType,
  Enumeration
}

/**
 * Represents an element in Enterprise Architect
 * @see ElementType for possible types of an EaElement
 */
export class EaElement extends EaObject {
  public readonly type: ElementType;
  public readonly packageId: number;
  private _path: string | undefined;

  public constructor(
    id: number,
    guid: string,
    name: string,
    type: ElementType,
    packageId: number,
  ) {
    super(id, guid, name);

    this.type = type;
    this.packageId = packageId;
  }

  public path(): string {
    if (!this._path) {
      // Log error that path was not set yet
      return this.name;
    }

    return this._path;
  }

  public setPath(value: string): void {
    this._path = value;
  }
}
