import type { EaObject } from './Object';

/**
 * Represents a diagram in Enterprise Architect
 */
export interface EaDiagram extends EaObject {
  packageId: number;
  connectorsIds: number[];
  elementIds: number[];
}
