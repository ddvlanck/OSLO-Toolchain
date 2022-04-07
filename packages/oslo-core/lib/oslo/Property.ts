import { Class } from './Class';
import type { Scope } from './Scope';

export interface Property {
  // TODO: change to Language string
  definition: string;
  // FIXME: not yet available
  derived?: boolean;
  // TODO: change to Language string
  label: string;
  minCardinality: string;
  maxCardinality: string;
  // FIXME: not yet available
  scope?: Scope;
  // TODO: check if we can change type to 'URL'
  uri: string;
  // TODO: change to Language string
  usageNote: string;
  // TODO: make type Class and include class as a whole?
  domain: string;
  // FIXME: not yet available
  parent?: Property;
}
