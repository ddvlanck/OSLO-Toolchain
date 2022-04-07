import type { Scope } from './Scope';

export interface DataType {
  // TODO: change to Language string
  definition: string;
  // TODO: change to Language string
  label: string;
  // FIXME: not yet available
  scope?: Scope;
  // TODO: check if we can use type 'URL'
  uri: string;
  // TODO: change to Language string
  usageNote: string;
}
