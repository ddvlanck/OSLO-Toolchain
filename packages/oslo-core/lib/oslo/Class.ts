import type { Scope } from './Scope';

export interface Class {
  definition: Map<string, string>;
  label: Map<string, string>;
  // FIXME: not yet present
  scope?: Scope;
  // TODO: check if we can use type 'URL'
  uri: string;
  usageNote: Map<string, string>;
  // FIXME: not available yet
  // TODO: make type Class and include class as a whole or not?
  parent?: string;
}
