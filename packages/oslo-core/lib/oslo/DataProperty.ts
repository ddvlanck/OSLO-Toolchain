import type { DataType } from './DataType';
import type { Property } from './Property';

export interface DataProperty extends Property {
  range: DataType;
}
