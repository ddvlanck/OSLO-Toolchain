import { Class } from './Class';
import type { Scope } from './Scope';

export interface Property {
  definition: Map<string, string>;
  // FIXME: not yet available
  derived?: boolean;
  label: Map<string, string>;
  minCardinality: string;
  maxCardinality: string;
  // FIXME: not yet available
  scope?: Scope;
  // TODO: check if we can change type to 'URL'
  uri: string;
  usageNote: Map<string, string>;
  // TODO: make type Class and include class as a whole?
  domain: string;
  // FIXME: not yet available
  parent?: Property;
}
