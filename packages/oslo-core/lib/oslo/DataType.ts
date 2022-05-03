import type { Scope } from './Scope';

/**
 * Interface representating a DataType object in OSLO
 */
export interface DataType {
  definition: Map<string, string>;
  label: Map<string, string>;
  scope: Scope;
  uri: URL;
  usageNote: Map<string, string>;
}
