import type { Class } from './Class';
import type { DataType } from './DataType';
import type { Property } from './Property';

/**
 * Interface representating a Diagram object in OSLO
 */
export interface Diagram {
  license: string;
  classes: Class[];
  properties: Property[];
  dataTypes: DataType[];
}
