import type { EaConnector, Tag } from '@oslo-flanders/ea-extractor';
// eslint-disable-next-line import/no-commonjs
const uniqid = require('uniqid');

export enum NormalizedConnectorType {
  AssociationClassConnector,
  RegularConnector
}

export class NormalizedConnector {
  private readonly innerConnector: EaConnector;
  private readonly _id: string;
  private readonly _sourceObjectId: number;
  private readonly _destinationObjectId: number;
  private readonly _cardinality: string;
  private readonly _type: NormalizedConnectorType;
  private _tags: Tag[];

  public constructor(
    innerConnector: EaConnector,
    name: string | undefined,
    sourceObjectId: number,
    targetObjectId: number,
    cardinality: string | undefined,
    tags: Tag[],
    type: NormalizedConnectorType,
  ) {
    this.innerConnector = innerConnector;
    this._id = uniqid();
    this._sourceObjectId = sourceObjectId;
    this._destinationObjectId = targetObjectId;
    this._cardinality = cardinality || '';
    this._type = type;
    this._tags = tags;

    if (name) {
      this.addNameTag(name);
    }
  }

  public get id(): string {
    return this._id;
  }

  public get innerConnectorId(): number {
    return this.innerConnector.id;
  }

  public get type(): NormalizedConnectorType {
    return this._type;
  }

  public get innerConnectorType(): string {
    return this.innerConnector.type;
  }

  public get sourceObjectId(): number {
    return this._sourceObjectId;
  }

  public get destinationObjectId(): number {
    return this._destinationObjectId;
  }

  public get cardinality(): string {
    return this._cardinality;
  }

  public get innerConnectorName(): string {
    return this.innerConnector.name;
  }

  public get tags(): Tag[] {
    return this._tags;
  }

  public set tags(value: Tag[]) {
    this._tags = value;
  }

  public addNameTag(name: string): void {
    const tag: Tag = {
      id: 0,
      tagName: 'name',
      tagValue: name,
    };

    this.tags = [...this.tags, tag];
  }
}
