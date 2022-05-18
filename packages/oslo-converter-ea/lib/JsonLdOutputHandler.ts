import { writeFile } from 'fs/promises';
import type { OutputHandler, Package, Class, DataType, Property, Logger } from '@oslo-flanders/core';
import { ContributorType } from '@oslo-flanders/core';
import { CsvParser } from '@oslo-flanders/stakeholder-extractor';

export class JsonLdOutputHandler implements OutputHandler {
  private readonly jsonLdPackages: any[];
  private readonly jsonLdClasses: any[];
  private readonly jsonLdDataTypes: any[];
  private readonly jsonLdAttributes: any[];
  private readonly contributors: any[];
  private readonly authors: any[];
  private readonly editors: any[];
  private id: string;

  public constructor() {
    this.jsonLdPackages = [];
    this.jsonLdClasses = [];
    this.jsonLdDataTypes = [];
    this.jsonLdAttributes = [];
    this.contributors = [];
    this.authors = [];
    this.editors = [];
    this.id = '';
  }

  /**
   * Writes a JSON-LD document
   */
  public async write(path: string): Promise<void> {
    const report = this.createReport();
    await writeFile(path, JSON.stringify(report, null, 2));
  }

  public addOntologyUri(id: string): void {
    this.id = id;
  }

  public async addStakeholders(stakeholdersFile: string): Promise<void> {
    const parser = new CsvParser();
    await parser.parseCsv(stakeholdersFile);

    parser.contributors.forEach(contributor => {
      switch (contributor.contributorType) {
        case ContributorType.Author:
          this.authors.push(contributor);
          break;

        case ContributorType.Editor:
          this.editors.push(contributor);
          break;

        case ContributorType.Contributor:
          this.contributors.push(contributor);
          break;

        case ContributorType.Unknown:
        default:
        // Log error
      }
    });
  }

  public addPackage(_package: Package): void {
    this.jsonLdPackages.push({
      '@id': _package.ontologyUri,
      '@type': 'Package',
      baseUri: _package.baseUri,
    });
  }

  public addClass(_class: Class): void {
    this.jsonLdClasses.push({
      '@id': _class.uri,
      '@type': 'http://www.w3.org/2002/07/owl#Class',
      definition: Array.from(_class.definition, ([language, value]) => ({ '@language': language, '@value': value })),
      label: Array.from(_class.label, ([language, value]) => ({ '@language': language, '@value': value })),
      usageNote: Array.from(_class.usageNote, ([language, value]) => ({ '@language': language, '@value': value })),
      parent: _class.parent,
      scope: _class.scope,
    });
  }

  // FIXME: @language within label of associaiton class pointing to target class, language is 'label'
  public addAttribute(attribute: Property): void {
    this.jsonLdAttributes.push({
      '@id': attribute.uri,
      '@type': attribute.type,
      definition: Array.from(attribute.definition, ([language, value]) => ({ '@language': language, '@value': value })),
      label: Array.from(attribute.label, ([language, value]) => ({ '@language': language, '@value': value })),
      usageNote: Array.from(attribute.usageNote, ([language, value]) => ({ '@language': language, '@value': value })),
      domain: {
        '@id': attribute.domain,
        '@type': 'http://www.w3.org/2002/07/owl#Class',
        label: attribute.domainLabel,
      },
      range: {
        '@id': attribute.range,
        label: attribute.rangeLabel,
      },
      maxCard: attribute.maxCardinality,
      minCard: attribute.minCardinality,
      scope: attribute.scope,
    });
  }

  public addDataType(datatype: DataType): void {
    this.jsonLdDataTypes.push({
      '@id': datatype.uri,
      '@type': 'DataType',
      definition: Array.from(datatype.definition, ([language, value]) => ({ '@language': language, '@value': value })),
      label: Array.from(datatype.label, ([language, value]) => ({ '@language': language, '@value': value })),
      usageNote: Array.from(datatype.usageNote, ([language, value]) => ({ '@language': language, '@value': value })),
      scope: datatype.scope,
    });
  }

  private createReport(): any {
    return {
      '@context': this.getContext(),
      '@id': this.id,
      packages: this.jsonLdPackages,
      classes: this.jsonLdClasses,
      attributes: this.jsonLdAttributes,
      dataTypes: this.jsonLdDataTypes,
      contributors: this.contributors,
      editors: this.editors,
      authors: this.authors,
    };
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
      label: {
        '@id': 'rdfs:label',
        '@container': '@language',
      },
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
      classes: '@included',
      datatypes: '@included',
      attributes: '@included',
      name: {
        '@id': 'rdfs:label',
        '@container': '@language',
      },
      definition: {
        '@id': 'rdfs:comment',
        '@container': '@language',
      },
      properties: {
        '@reverse': 'rdfs:isDefinedBy',
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
      generalization: {
        '@id': 'rdfs:subPropertyOf',
      },
      externals: {
        '@type': 'http://www.w3.org/2000/01/rdf-schema#Class',
        '@id': 'rdfs:seeAlso',
      },
      usage: {
        '@id': 'vann:usageNote',
        '@container': '@language',
      },
      parent: {
        '@id': 'rdfs:subClassOf',
        '@type': 'rdfs:Class',
      },
    };
  }
}
