import hash from 'object-hash';
import { EaObject } from './Object';

/**
 * Represents a package in Enterprise Architect
 *
 * A package has two fields pointing to an identifier:
 * - id (inferred from EaObject) - references the object id
 * - packageId - references the actual packageId which must be used by other objects
 * to refer to the package
 */
export class EaPackage extends EaObject {
  public readonly packageId: number;
  public parentId: number;
  public parent: EaPackage | undefined;

  public constructor(
    id: number,
    guid: string,
    name: string,
    packageId: number,
    parentId: number,
  ) {
    super(id, guid, name);

    this.packageId = packageId;
    this.parentId = parentId;

    this.internalGuid = hash(this);
  }

  public path(): string {
    if (this.parent) {
      return `${this.parent.path()}:${this.name}`;
    }

    return this.name;
  }

  public setPath(path: string): void {
    throw new Error('Method not implemented.');
  }

  public setParent(parent: EaPackage): void {
    this.parent = parent;
  }
}
