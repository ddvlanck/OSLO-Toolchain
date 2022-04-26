import type { Scope } from './Scope';

export interface Class {
  definition: Map<string, string>;
  label: Map<string, string>;
  scope: Scope;
  uri: URL;
  usageNote: Map<string, string>;
  codelist?: URL;
  // FIXME: not available yet
  // TODO: make type Class and include class as a whole or not?
  parent?: string;
}
