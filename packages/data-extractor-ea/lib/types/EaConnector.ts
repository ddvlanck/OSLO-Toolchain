import type { EaObject } from './Object';
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
}

/**
 * Represents a connector in Enterprise Architect
 */
export interface EaConnector extends EaObject {
  sourceObjectId: number;
  destinationObjectId: number;
  type: string;
  sourceCardinality?: string;
  destinationCardinality?: string;
  sourceRole?: string;
  destinationRole?: string;
  associationClassId?: number;
  sourceRoleTags?: Tag[];
  destinationRoleTags?: Tag[];
  direction: ConnectorDirection;

  // These properties are derived in the DiagramLoader
  diagramGeometryDirection: ConnectorDirection;
  hidden: boolean;
}
