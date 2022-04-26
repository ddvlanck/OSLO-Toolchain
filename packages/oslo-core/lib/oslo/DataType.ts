import type { Scope } from './Scope';

export interface DataType {
  definition: Map<string, string>;
  label: Map<string, string>;
  scope: Scope;
  uri: URL;
  usageNote: Map<string, string>;
}
