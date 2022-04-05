import type { Tag } from './Tag';

/**
 * General object that contains properties every object in an
 * Enterprise Architect file has
 */
export abstract class EaObject {
  public readonly id: number;
  public readonly guid: string;
  public readonly name: string;
  public tags: Tag[];

  public constructor(id: number, guid: string, name: string) {
    this.id = id;
    this.guid = guid;
    this.name = name;
    this.tags = [];
  }

  public abstract path(): string;
  public abstract setPath(path: string): void;
}
