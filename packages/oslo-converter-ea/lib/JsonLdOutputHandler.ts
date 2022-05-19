import { writeFile } from 'fs/promises';
import { ns, OutputHandler } from '@oslo-flanders/core';
import type * as RDF from '@rdfjs/types';

// TODO: check if we can use a serializer npm package
export class JsonLdOutputHandler extends OutputHandler {
  public async write(path: string): Promise<void> {
    const osloPackages = this.getOsloPackages();
    const osloClasses = this.getOsloClasses();
    const osloAttribtues = this.getOsloAttributes();
    const osloDatatypes = this.getDatatypes();

    const document: any = {};
    document['@context'] = this.getContext();
    document['@id'] = ns.example('TestId').value;
    document.packages = osloPackages;
    document.classes = osloClasses;
    document.attributes = osloAttribtues;
    document.datatypes = osloDatatypes;

    // TODO: add stakeholders

    await writeFile(path, JSON.stringify(document, null, 2));
  }

  // Returns an array because a literal can be annotated with multiple languages
  private getLiterals(quads: RDF.Quad[], predicate: RDF.NamedNode): RDF.Literal[] {
    return quads.filter(x => x.predicate.equals(predicate)).map(x => <RDF.Literal>x.object);
  }

  private getLiteral(quads: RDF.Quad[], predicate: RDF.NamedNode): RDF.Literal {
    return <RDF.Literal>quads.find(x => x.predicate.equals(predicate))?.object;
  }

  private getOsloPackages(): any {
    const packages = this.store.getQuads(null, ns.rdf('type'), ns.example('Package'), null);

    return packages.map(packageQuad => {
      const quads = this.store.getQuads(packageQuad.subject, null, null, null);
      const baseUriLiteral = this.getLiteral(quads, ns.example('baseUri'));

      return {
        '@id': packageQuad.subject.value,
        '@type': 'Package',
        baseUri: baseUriLiteral.value,
      };
    });
  }

  private getOsloClasses(): any {
    const classes = this.store.getQuads(null, ns.rdf('type'), ns.owl('Class'), null);

    return classes.map(classQuad => {
      const quads = this.store.getQuads(classQuad.subject, null, null, null);
      const definitionLiterals = this.getLiterals(quads, ns.rdfs('comment'));
      const labelLiterals = this.getLiterals(quads, ns.rdfs('label'));
      const usageNoteLiterals = this.getLiterals(quads, ns.vann('usageNote'));
      // TODO: when using a codelist for scope, this can not be a literal anymore.
      const scopeLiteral = this.getLiteral(quads, ns.example('scope'));
      const parentLiteral = this.getLiteral(quads, ns.rdfs('subClassOf'));
      let parentLabelLiterals: RDF.Literal[] | undefined;

      if (parentLiteral) {
        const labelQuads = this.store.getQuads(
          this.factory.namedNode(parentLiteral.value),
          ns.rdfs('label'),
          null,
          null,
        );

        if (labelQuads.length === 0) {
          // TODO: log warning that label for parent could not be found?
        }

        parentLabelLiterals = labelQuads.map(x => <RDF.Literal>x.object);
      }

      return {
        '@id': classQuad.subject.value,
        '@type': 'Class',
        label: labelLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        definition: definitionLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        usageNote: usageNoteLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        ...parentLiteral && {
          parent: {
            '@id': parentLiteral.value,
            '@type': 'Class',
            ...parentLabelLiterals && {
              label: parentLabelLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
            },
          },
        },
        scope: scopeLiteral.value,
      };
    });
  }

  public getOsloAttributes(): any {
    const datatypeAttributes = this.store.getQuads(null, ns.rdf('type'), ns.owl('DatatypeProperty'), null);
    const objectPropertyAttributes = this.store.getQuads(null, ns.rdf('type'), ns.owl('ObjectProperty'), null);
    const propertyAttributes = this.store.getQuads(null, ns.rdf('type'), ns.rdf('Property'), null);

    return [
      ...datatypeAttributes,
      ...objectPropertyAttributes,
      ...propertyAttributes,
    ].map(attributeQuad => {
      const quads = this.store.getQuads(attributeQuad.subject, null, null, null);

      // Attributes generated by the normalization of the connectors (associationclasses)
      // do not have a definition
      const definitionLiterals = this.getLiterals(quads, ns.rdfs('comment'));
      const labelLiterals = this.getLiterals(quads, ns.rdfs('label'));
      const usageNoteLiterals = this.getLiterals(quads, ns.vann('usageNote'));
      const domainLiteral = this.getLiteral(quads, ns.rdfs('domain'));
      let domainLabelLiterals: RDF.Literal[] | undefined;

      if (domainLiteral) {
        const domainLabelQuads = this.store.getQuads(
          this.factory.namedNode(domainLiteral.value),
          ns.rdfs('label'),
          null,
          null,
        );

        if (domainLabelQuads.length === 0) {
          // TODO: log warning that label for domain could not be found?
        }

        domainLabelLiterals = domainLabelQuads.map(x => <RDF.Literal>x.object);
      }

      const rangeLiteral = this.getLiteral(quads, ns.rdfs('range'));
      let rangeLabelLiterals: RDF.Literal[] | undefined;

      if (rangeLiteral) {
        const rangeLabelQuads = this.store.getQuads(
          this.factory.namedNode(rangeLiteral.value),
          ns.rdfs('label'),
          null,
          null,
        );

        if (rangeLabelQuads.length === 0) {
          // TODO: log warning that label for range could not be found?
        }

        // TODO: log warning that range has multiple labels
        rangeLabelLiterals = rangeLabelQuads.map(x => <RDF.Literal>x.object);
      }

      const maxCardinalityLiteral = this.getLiteral(quads, ns.shacl('maxCount'));
      const minCardinalityLiteral = this.getLiteral(quads, ns.shacl('minCount'));
      // TODO: when using codelists, this will not by a literal anymore
      const scopeLiteral = this.getLiteral(quads, ns.example('scope'));

      return {
        '@id': attributeQuad.subject.value,
        '@type': attributeQuad.object.value,
        label: labelLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        ...definitionLiterals && {
          definition: definitionLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        },
        ...usageNoteLiterals && {
          usageNote: usageNoteLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        },
        domain: {
          '@id': domainLiteral.value,
          '@type': 'Class',
          ...domainLabelLiterals && {
            label: domainLabelLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
          },
        },
        range: {
          '@id': rangeLiteral.value,
          ...(rangeLabelLiterals && rangeLabelLiterals.length > 0) && {
            label: rangeLabelLiterals.length > 1 ?
              rangeLabelLiterals.map(x => ({ '@language': x.language, '@value': x.value })) :
              rangeLabelLiterals[0].value,
          },
        },
        minCount: minCardinalityLiteral.value,
        maxCount: maxCardinalityLiteral.value,
        scope: scopeLiteral.value,
      };
    });
  }

  private getDatatypes(): any {
    const datatypes = this.store.getQuads(null, ns.rdf('type'), ns.example('DataType'), null);

    return datatypes.map(datatypeQuad => {
      const quads = this.store.getQuads(datatypeQuad.subject, null, null, null);

      const definitionLiterals = this.getLiterals(quads, ns.rdfs('comment'));
      const labelLiterals = this.getLiterals(quads, ns.rdfs('label'));
      const usageNoteLiterals = this.getLiterals(quads, ns.vann('usageNote'));
      // TODO: when using a codelist for scope, this can not be a literal anymore.
      const scopeLiteral = this.getLiteral(quads, ns.example('scope'));

      return {
        '@id': datatypeQuad.subject.value,
        '@type': 'Datatype',
        label: labelLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        definition: definitionLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        usageNote: usageNoteLiterals.map(x => ({ '@language': x.language, '@value': x.value })),
        scope: scopeLiteral.value,
      };
    });
  }

  private getContext(): any {
    return {
      vlaanderen: 'http://data.vlaanderen.be/ns/',
      owl: 'http://www.w3.org/2002/07/owl#',
      void: 'http://rdfs.org/ns/void#',
      dcterms: 'http://purl.org/dc/terms/',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      dcat: 'http://www.w3.org/ns/dcat#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      qb: 'http://purl.org/linked-data/cube#',
      skos: 'http://www.w3.org/2004/02/skos/core#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      foaf: 'http://xmlns.com/foaf/0.1/',
      person: 'http://www.w3.org/ns/person#',
      rec: 'http://www.w3.org/2001/02pd/rec54#',
      vann: 'http://purl.org/vocab/vann/',
      sh: 'http://w3.org/ns/shacl#',
      authors: {
        '@type': 'foaf:Person',
        '@id': 'foaf:maker',
      },
      editors: {
        '@type': 'foaf:Person',
        '@id': 'rec:editor',
      },
      contributors: {
        '@type': 'foaf:Person',
        '@id': 'dcterms:contributor',
      },
      affiliation: {
        '@id': 'http://schema.org/affiliation',
      },
      classes: 'http://example.org/classes',
      datatypes: 'http://example.org/datatypes',
      attributes: 'http://example.org/attributes',
      label: {
        '@id': 'rdfs:label',
        '@container': '@language',
      },
      definition: {
        '@id': 'rdfs:comment',
        '@container': '@language',
      },
      usageNote: {
        '@id': 'vann:usageNote',
        '@container': '@language',
      },
      domain: {
        '@id': 'rdfs:domain',
      },
      range: {
        '@id': 'rdfs:range',
      },
      minCardinality: {
        '@id': 'sh:minCount',
      },
      maxCardinality: {
        '@id': 'sh:maxCount',
      },
      parent: {
        '@id': 'rdfs:subClassOf',
        '@type': 'rdfs:Class',
      },
      scope: {
        '@id': 'http://example.org/scope',
      },
      Class: {
        '@id': 'rdfs:Class',
      },
    };
  }
}
