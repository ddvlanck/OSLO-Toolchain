import hash from 'object-hash';
import { EaObject } from './Object';
import type { Tag } from './Tag';

/**
 * Enumeration used to specify the type of a connector
 */
export enum ConnectorType {
  Aggregation = 'Aggregation',
  Association = 'Association',
  Generalization = 'Generalization'
}

/**
 * Enumeration used to specify the direction of a connector
 */
export enum ConnectorDirection {
  Unspecified,
  SourceToDest,
  Bidirectional,
  DestToSource,
  Unknown
}

/**
 * Represents a connector in Enterprise Architect
 */
export class EaConnector extends EaObject {
  public readonly sourceObjectId: number;
  public readonly destinationObjectId: number;
  public readonly type: string;
  public readonly sourceCardinality: string;
  public readonly destinationCardinality: string;
  public readonly sourceRole: string;
  public readonly destinationRole: string;
  public readonly associationClassId: number | null;
  public sourceRoleTags: Tag[] = [];
  public destinationRoleTags: Tag[] = [];
  public readonly direction: ConnectorDirection;
  private _path: string | undefined;

  // These properties are derived in the DiagramLoader
  public diagramGeometryDirection: ConnectorDirection;
  public hidden: boolean;

  public constructor(
    id: number,
    guid: string,
    name: string,
    type: string,
    sourceObjectId: number,
    destinationObjectId: number,
    sourceCardinality: string,
    destinationCardinality: string,
    sourceRole: string,
    destinationRole: string,
    associationClassId: number | null,
    direction: ConnectorDirection = ConnectorDirection.Unspecified,
  ) {
    super(id, guid, name);

    this.type = type;
    this.sourceObjectId = sourceObjectId;
    this.destinationObjectId = destinationObjectId;
    this.sourceCardinality = sourceCardinality;
    this.destinationCardinality = destinationCardinality;
    this.sourceRole = sourceRole;
    this.destinationRole = destinationRole;
    this.associationClassId = associationClassId;
    this.direction = direction;

    this.diagramGeometryDirection = direction;
    this.hidden = false;

    this.internalGuid = hash(this);
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
