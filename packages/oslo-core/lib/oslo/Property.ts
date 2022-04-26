import type { Scope } from './Scope';

export enum PropertyType {
  DataTypeProperty = 'http://www.w3.org/2002/07/owl#DatatypeProperty',
  ObjectProperty = 'http://www.w3.org/2002/07/owl#ObjectProperty',
  Property = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property',
}

export interface Property {
  definition: Map<string, string>;
  // FIXME: not yet available
  derived?: boolean;
  label: Map<string, string>;
  minCardinality?: string;
  maxCardinality?: string;
  scope: Scope;
  // TODO: check if we can change type to 'URL'
  uri: URL;
  usageNote: Map<string, string>;
  domain: string;
  domainLabel: string;
  // FIXME: not yet available: fetch parentURI tag (only in case of a Vocabulary)
  parent?: Property;
  range: string;
  rangeLabel?: string;
  type: PropertyType;
}
