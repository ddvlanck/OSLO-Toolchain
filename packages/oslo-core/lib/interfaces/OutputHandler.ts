import type * as RDF from '@rdfjs/types';
import * as N3 from 'n3';
import { DataFactory } from 'rdf-data-factory';

export type RdfObjectTypes = RDF.NamedNode | RDF.Literal | RDF.Literal[];

/**
 * Interface that writes the OSLO objects to a file in an RDF format
 */
export abstract class OutputHandler {
  protected readonly store: N3.Store;
  public readonly factory: DataFactory;

  public constructor() {
    this.store = new N3.Store();
    this.factory = new DataFactory();
  }

  public abstract write(path: string): Promise<void>;

  public add(subject: RDF.NamedNode, predicate: RDF.NamedNode, object: RdfObjectTypes): void {
    if (Array.isArray(object)) {
      object.forEach(objectLiteral => this.store.addQuad(subject, predicate, objectLiteral));
    } else {
      this.store.addQuad(subject, predicate, object);
    }
  }

  public exists(subject: RDF.NamedNode, predicate: RDF.NamedNode): boolean {
    return this.store.getQuads(subject, predicate, null, null).length > 0;
  }
}
