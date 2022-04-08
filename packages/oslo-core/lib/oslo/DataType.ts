import type { Scope } from './Scope';

export interface DataType {
  definition: Map<string, string>;
  label: Map<string, string>;
  // FIXME: not yet available
  scope?: Scope;
  // TODO: check if we can use type 'URL'
  uri: string;
  usageNote: Map<string, string>;
}
