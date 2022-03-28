import type { EaConnector } from '@oslo-flanders/ea-data-extractor';
import { ConnectorDirection } from '@oslo-flanders/ea-data-extractor';
import type { Tag } from '@oslo-flanders/ea-data-extractor/lib/types/Tag';
import { getLoggerFor } from '@oslo-flanders/types';
import { AssociationClassConnectionPart } from './AssociationClassConnectionPart';

export class AssociationClassConnector implements EaConnector {
  private readonly logger = getLoggerFor(this);

  private readonly connector: EaConnector;
  private readonly connectionPart: AssociationClassConnectionPart;
  private readonly tagPrefix: string;

  public associationClassId?: number;

  public constructor(
    connector: EaConnector,
    connectionPart: AssociationClassConnectionPart,
    tagPrefix: string,
  ) {
    if (!connector.associationClassId) {
      this.logger.error(`Connector with ea_guid ${connector.guid} does not have an association class`);
    }

    this.connector = connector;
    this.connectionPart = connectionPart;
    this.tagPrefix = tagPrefix;
  }

  public get id(): number {
    return this.connector.id;
  }

  public get name(): string | undefined {
    return this.connector.name;
  }

  public get diagramGeometryDirection(): ConnectorDirection {
    return this.connector.diagramGeometryDirection;
  }

  public get direction(): ConnectorDirection {
    return ConnectorDirection.SourceToDest;
  }

  public get type(): string {
    return this.connector.type;
  }

  public get sourceRole(): string | undefined {
    if (this.connectionPart === AssociationClassConnectionPart.SourceToAssociation) {
      return this.connector.sourceRole;
    }

    if (this.connectionPart === AssociationClassConnectionPart.DestinationToAssociation) {
      return this.connector.destinationRole;
    }

    return undefined;
  }

  public get sourceRoleTags(): Tag[] | undefined {
    return this.connector.sourceRoleTags;
  }

  public get destinationRole(): string | undefined {
    if (this.connectionPart === AssociationClassConnectionPart.AssociationToDestination) {
      return this.connector.destinationRole;
    }

    if (this.connectionPart === AssociationClassConnectionPart.AssociationToSource) {
      return this.connector.sourceRole;
    }

    return undefined;
  }

  public get destinationRoleTags(): Tag[] | undefined {
    return this.connector.destinationRoleTags;
  }

  public get sourceObjectId(): number {
    if (this.connectionPart === AssociationClassConnectionPart.SourceToAssociation) {
      return this.connector.sourceObjectId;
    }

    if (this.connectionPart === AssociationClassConnectionPart.DestinationToAssociation) {
      return this.connector.destinationObjectId;
    }

    // TODO: log error if null
    return this.connector.associationClassId!;
  }

  public get destinationObjectId(): number {
    if (this.connectionPart === AssociationClassConnectionPart.AssociationToDestination) {
      return this.connector.destinationObjectId;
    }

    if (this.connectionPart === AssociationClassConnectionPart.AssociationToSource) {
      return this.connector.sourceObjectId;
    }

    // TODO: log error if null
    return this.connector.associationClassId!;
  }

  public get guid(): string {
    return this.connector.guid;
  }

  public get tags(): Tag[] {
    const filteredTags: Tag[] = [];

    this.connector.tags?.forEach(tag => {
      if (tag.tagName.startsWith(this.tagPrefix)) {
        filteredTags.push({
          id: tag.id,
          tagName: tag.tagName.slice(this.tagPrefix.length),
          tagValue: tag.tagValue,
        });
      }
    });

    return filteredTags;
  }

  public get sourceCardinality(): string | undefined {
    switch (this.connectionPart) {
      case AssociationClassConnectionPart.AssociationToDestination:
        return this.connector.sourceCardinality;

      case AssociationClassConnectionPart.AssociationToSource:
        return this.connector.destinationCardinality;

      case AssociationClassConnectionPart.SourceToAssociation:
      case AssociationClassConnectionPart.DestinationToAssociation:
        return '1';

      default:
        throw new Error(`Cardinality was not set right`);
    }
  }

  public get destinationCardinality(): string | undefined {
    switch (this.connectionPart) {
      case AssociationClassConnectionPart.SourceToAssociation:
        return this.connector.destinationCardinality;

      case AssociationClassConnectionPart.DestinationToAssociation:
        return this.connector.sourceCardinality;

      case AssociationClassConnectionPart.AssociationToDestination:
      case AssociationClassConnectionPart.AssociationToSource:
        return '1';

      default:
        throw new Error(`Cardinality was not set right`);
    }
  }

  public get hidden(): boolean {
    return this.connector.hidden;
  }
}
