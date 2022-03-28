import type { EaConnector, Tag } from '@oslo-flanders/ea-data-extractor';
import { ConnectorDirection } from '@oslo-flanders/ea-data-extractor';
import { getLoggerFor } from '@oslo-flanders/types';

export enum RoleConnectionPart {
  SourceToDest,
  DestToSource,
  UnspecifiedSourceToDest,
  UnspecifiedDestToSource
}

export class RoleConnector implements EaConnector {
  private readonly logger = getLoggerFor(this);

  private readonly connector: EaConnector;
  private readonly connectionPart: RoleConnectionPart;
  private readonly newLabels: Tag[];

  public constructor(connector: EaConnector, connectionPart: RoleConnectionPart, newLabels?: Tag[]) {
    this.connector = connector;
    this.connectionPart = connectionPart;
    this.newLabels = newLabels || [];
  }

  /**
   * The name is the name of the role and is used to construct the URI.
   * If not given, and derived from a connector without a direction, add the domain class first
   * otherwise, use the role name with the first character lowercase.
   */
  public get name(): string | undefined {
    if (this.connectionPart === RoleConnectionPart.UnspecifiedDestToSource ||
      this.connectionPart === RoleConnectionPart.UnspecifiedSourceToDest) {
      return this.connector.name;
    }

    return this.destinationRole;
  }

  public get direction(): ConnectorDirection {
    return ConnectorDirection.SourceToDest;
  }

  public get type(): string {
    return this.connector.type;
  }

  public get sourceRole(): string | undefined {
    switch (this.connectionPart) {
      case RoleConnectionPart.SourceToDest:
        return this.connector.sourceRole;

      case RoleConnectionPart.DestToSource:
        return this.connector.destinationRole;

      case null:
      default:
        return undefined;
    }
  }

  public get sourceRoleTags(): Tag[] | undefined {
    if (this.connectionPart === RoleConnectionPart.SourceToDest) {
      return this.connector.sourceRoleTags;
    }

    if (this.connectionPart === RoleConnectionPart.DestToSource) {
      return this.connector.destinationRoleTags;
    }

    if (this.connectionPart === RoleConnectionPart.UnspecifiedDestToSource ||
      this.connectionPart === RoleConnectionPart.UnspecifiedSourceToDest) {
      return undefined;
    }

    return this.connector.sourceRoleTags;
  }

  public get destinationRole(): string | undefined {
    switch (this.connectionPart) {
      case RoleConnectionPart.SourceToDest:
        return this.connector.destinationRole;

      case RoleConnectionPart.DestToSource:
        return this.connector.sourceRole;

      case null:
      default:
        return undefined;
    }
  }

  public get destinationRoleTags(): Tag[] | undefined {
    if (this.connectionPart === RoleConnectionPart.SourceToDest) {
      return this.connector.destinationRoleTags;
    }

    if (this.connectionPart === RoleConnectionPart.DestToSource) {
      return this.connector.sourceRoleTags;
    }

    if (this.connectionPart === RoleConnectionPart.UnspecifiedDestToSource ||
      this.connectionPart === RoleConnectionPart.UnspecifiedSourceToDest) {
      return this.connector.tags;
    }

    return this.connector.destinationRoleTags;
  }

  public get sourceObjectId(): number {
    if (this.connectionPart === RoleConnectionPart.SourceToDest ||
      this.connectionPart === RoleConnectionPart.UnspecifiedSourceToDest) {
      return this.connector.sourceObjectId;
    }

    return this.connector.destinationObjectId;
  }

  public get destinationObjectId(): number {
    if (this.connectionPart === RoleConnectionPart.SourceToDest ||
      this.connectionPart === RoleConnectionPart.UnspecifiedSourceToDest) {
      return this.connector.destinationObjectId;
    }

    return this.connector.sourceObjectId;
  }

  public get associationClassId(): number | undefined {
    return undefined;
  }

  public get guid(): string {
    return this.connector.guid;
  }

  // FIXME
  public get tags(): Tag[] | undefined {
    return [];
  }

  public get sourceCardinality(): string | undefined {
    if (this.connectionPart === RoleConnectionPart.SourceToDest ||
      this.connectionPart === RoleConnectionPart.UnspecifiedSourceToDest) {
      return this.connector.sourceCardinality;
    }

    if (this.connectionPart === RoleConnectionPart.DestToSource ||
      this.connectionPart === RoleConnectionPart.UnspecifiedDestToSource) {
      return this.connector.destinationCardinality;
    }

    throw new Error(`Connector should have a cardinality`);
  }

  public get destinationCardinality(): string | undefined {
    if (this.connectionPart === RoleConnectionPart.SourceToDest ||
      this.connectionPart === RoleConnectionPart.UnspecifiedSourceToDest) {
      return this.connector.destinationCardinality;
    }

    if (this.connectionPart === RoleConnectionPart.DestToSource ||
      this.connectionPart === RoleConnectionPart.UnspecifiedDestToSource) {
      return this.connector.sourceCardinality;
    }

    throw new Error(`Connector should have a cardinality`);
  }

  public get diagramGeometryDirection(): ConnectorDirection {
    return this.connector.diagramGeometryDirection;
  }

  public get hidden(): boolean {
    return this.connector.hidden;
  }

  public get id(): number {
    return this.connector.id;
  }
}
