import type { Scope } from './Scope';

export interface Class {
  // TODO: change to Language string
  definition: string;
  // TODO: change to Language string
  label: string;
  // FIXME: not yet present
  scope?: Scope;
  // TODO: check if we can use type 'URL'
  uri: string;
  // TODO: change to Language string
  usageNote: string;
  // FIXME: not available yet
  // TODO: make type Class and include class as a whole or not?
  parent?: string;
}
