import { Class } from './Class';
import type { Scope } from './Scope';

export interface Property {
  // TODO: change to Language string
  definition: string;
  derived: boolean;
  // TODO: change to Language string
  label: string;
  minCardinality: string;
  maxCardinality: string;
  scope: Scope;
  // TODO: check if we can change type to 'URL'
  uri: string;
  // TODO: change to Language string
  usageNote: string;
  domain: Class;
  parent: Property;
}
