import type { Tag } from './Tag';

/**
 * General object that contains properties every object in an
 * Enterprise Architect file has
 */
export abstract class EaObject {
  public readonly id: number;
  public readonly eaGuid: string;
  private _internalGuid: string | undefined;
  public readonly name: string;
  public tags: Tag[];

  public constructor(id: number, guid: string, name: string) {
    this.id = id;
    this.eaGuid = guid;
    this.name = name;
    this.tags = [];
  }

  public abstract path(): string;
  public abstract setPath(path: string): void;

  public get internalGuid(): string {
    if (!this._internalGuid) {
      throw new Error(`Internal guid has not been set yet for object with EA guid ${this.eaGuid}`);
    }
    return this._internalGuid;
  }

  public set internalGuid(value: string) {
    this._internalGuid = value;
  }
}
