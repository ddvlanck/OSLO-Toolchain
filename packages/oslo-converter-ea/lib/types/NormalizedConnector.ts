import type { Tag, EaConnector } from '@oslo-flanders/ea-extractor';

export enum NormalizedConnectorType {
  AssociationClassConnector,
  RegularConnector
}

export class NormalizedConnector {
  private readonly innerConnector: EaConnector;
  private readonly _normalizedId: number;
  private readonly _normalizedName: string;
  private readonly _normalizedSourceObjectId: number;
  private readonly _normalizedDestinationObjectId: number;
  private readonly _normalizedCardinality: string;
  private readonly _normalizedType: NormalizedConnectorType;
  private _normalizedTags: Tag[];

  public constructor(
    innerConnector: EaConnector,
    name: string,
    sourceObjectId: number,
    destinationObjectId: number,
    cardinality: string,
    tags: Tag[] = [],
    type: NormalizedConnectorType = NormalizedConnectorType.RegularConnector,
  ) {
    this.innerConnector = innerConnector;
    this._normalizedId = Math.floor(Math.random() * Date.now());
    this._normalizedName = name;
    this._normalizedSourceObjectId = sourceObjectId;
    this._normalizedDestinationObjectId = destinationObjectId;
    this._normalizedCardinality = cardinality;
    this._normalizedType = type;
    this._normalizedTags = tags;

    if (name) {
      this.addNameTag(name);
    }
  }

  public get name(): string {
    return this._normalizedName;
  }

  public get innerConnectorName(): string {
    return this.innerConnector.name;
  }

  public get innerConnectorId(): number {
    return this.innerConnector.id;
  }

  public get id(): number {
    return this._normalizedId;
  }

  public get type(): NormalizedConnectorType {
    return this._normalizedType;
  }

  public get innerConnectorType(): string {
    return this.innerConnector.type;
  }

  public get sourceObjectId(): number {
    return this._normalizedSourceObjectId;
  }

  public get destinationObjectId(): number {
    return this._normalizedDestinationObjectId;
  }

  public get cardinality(): string {
    return this._normalizedCardinality;
  }

  public get tags(): Tag[] {
    return this._normalizedTags;
  }

  public set tags(value: Tag[]) {
    this._normalizedTags = value;
  }

  public path(): string {
    return this.innerConnector.path();
  }

  public addNameTag(name: string): void {
    const tag: Tag = {
      id: 0,
      tagName: 'name',
      tagValue: name,
    };

    if (this._normalizedTags.some(x => x.tagName === 'name')) {
      return;
    }

    this._normalizedTags = [...this._normalizedTags, tag];
  }
}
