import type { EaElement } from './EaElement';
import type { Tag } from './Tag';

export interface EaConnector extends EaElement {
  sourceObjectId: number;
  destinationObjectId: number;
  type: string;
  sourceCardinality?: string;
  destinationCardinality?: string;
  sourceRole?: string;
  destinationRole?: string;
  associationClassId: number;

  // This is needed to extract connector role tags when present
  guid: string;
  sourceRoleTags?: Tag[];
  destinationRoleTags?: Tag[];
}
