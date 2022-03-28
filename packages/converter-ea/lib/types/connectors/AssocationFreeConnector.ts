import type { Tag, ConnectorDirection, EaConnector } from '@oslo-flanders/ea-data-extractor';

export class AssociationFreeConnector implements EaConnector {
  private readonly connector: EaConnector;
  private derivedUri: string;

  public constructor(connector: EaConnector) {
    this.connector = connector;
    this.derivedUri = '';
  }

  public get name(): string | undefined {
    return this.connector.name;
  }

  public get sourceObjectId(): number {
    return this.connector.sourceObjectId;
  }

  public get destinationObjectId(): number {
    return this.connector.destinationObjectId;
  }

  public get type(): string {
    return this.connector.type;
  }

  public get sourceCardinality(): string | undefined {
    return this.connector.sourceCardinality;
  }

  public get destinationCardinality(): string | undefined {
    return this.connector.destinationCardinality;
  }

  public get sourceRole(): string | undefined {
    return this.connector.sourceRole;
  }

  public get destinationRole(): string | undefined {
    return this.connector.destinationRole;
  }

  public get associationClassId(): number | undefined {
    return undefined;
  }

  public get sourceRoleTags(): Tag[] | undefined {
    return this.connector.sourceRoleTags;
  }

  public get destinationRoleTags(): Tag[] | undefined {
    return this.connector.destinationRoleTags;
  }

  public get diagramGeometryDirection(): ConnectorDirection {
    return this.connector.diagramGeometryDirection;
  }

  public get direction(): ConnectorDirection {
    return this.connector.direction;
  }

  public get hidden(): boolean {
    return this.connector.hidden;
  }

  public get id(): number {
    return this.connector.id;
  }

  public get guid(): string {
    return this.connector.guid;
  }

  public get tags(): Tag[] | undefined {
    return this.connector.tags;
  }

  public get connectorUri(): string {
    return this.derivedUri;
  }

  public set connectorUri(uri: string) {
    this.derivedUri = uri;
  }
}
