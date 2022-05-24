import type * as RDF from '@rdfjs/types';
import * as N3 from 'n3';
import { DataFactory } from 'rdf-data-factory';
import { ns } from '../utils/namespaces';

export type RdfObjectTypes = RDF.NamedNode | RDF.NamedNode[] | RDF.Literal | RDF.Literal[];

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

  public add(subject: RDF.NamedNode, predicate: RDF.NamedNode, object: RdfObjectTypes, graph?: RDF.NamedNode): void {
    if (Array.isArray(object)) {
      object.forEach(objectTerm => this.store.addQuad(subject, predicate, objectTerm, graph));
    } else {
      this.store.addQuad(subject, predicate, object, graph);
    }
  }

  public exists(subject: RDF.NamedNode, predicate: RDF.NamedNode): boolean {
    return this.store.getQuads(subject, predicate, null, null).length > 0;
  }

  public updateGraph(
    subject: RDF.NamedNode,
    object: RDF.NamedNode | RDF.Literal,
    graph: RDF.NamedNode,
  ): void {
    const graphQuad = this.store.getQuads(subject, ns.rdfs('label'), object, null)[0].graph;

    if (!graphQuad) {
      // TODO: log error
      return;
    }

    const quads = this.store.getQuads(null, null, null, graphQuad.value);
    this.store.removeMatches(null, null, null, graphQuad);

    quads.forEach(quad => {
      this.store.addQuad(quad.subject, quad.predicate, quad.object, graph);
    });
  }
}
