import { writeFile } from 'fs/promises';
import { ContributorType, OutputHandler, Person } from '@oslo-flanders/core';
import type { Class } from '@oslo-flanders/core/lib/oslo/Class';
import type { DataType } from '@oslo-flanders/core/lib/oslo/DataType';
import type { Package } from '@oslo-flanders/core/lib/oslo/Package';
import type { Property } from '@oslo-flanders/core/lib/oslo/Property';
import { CsvParser } from '@oslo-flanders/stakeholder-extractor';

export class JsonLdOutputHandler implements OutputHandler {
  private readonly jsonLdPackages: any[];
  private readonly jsonLdClasses: any[];
  private readonly jsonLdDataTypes: any[];
  private readonly contributors: any[];
  private readonly authors: any[];
  private readonly editors: any[];

  public constructor() {
    this.jsonLdPackages = [];
    this.jsonLdClasses = [];
    this.jsonLdDataTypes = [];
    this.contributors = [];
    this.authors = [];
    this.editors = [];
  }

  /**
   * Writes a JSON-LD document
   */
  public async write(): Promise<void> {
    const report = this.createReport();
    await writeFile('./test.jsonld', JSON.stringify(report, null, 4));
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
      '@type': 'Class',
      definition: Array.from(_class.definition, ([language, value]) => ({ '@language': language, '@value': value })),
      label: Array.from(_class.label, ([language, value]) => ({ '@language': language, '@value': value })),
      usageNote: Array.from(_class.usageNote, ([language, value]) => ({ '@language': language, '@value': value })),
      parent: _class.parent,
    });
  }

  public addAttribute(attribute: Property): void {
    // TODO
  }

  public addDataType(datatype: DataType): void {
    this.jsonLdDataTypes.push({
      '@id': datatype.uri,
      '@type': 'DataType',
      definition: Array.from(datatype.definition, ([language, value]) => ({ '@language': language, '@value': value })),
      label: Array.from(datatype.label, ([language, value]) => ({ '@language': language, '@value': value })),
      usageNote: Array.from(datatype.usageNote, ([language, value]) => ({ '@language': language, '@value': value })),
    });
  }

  private createReport(): any {
    return {
      packages: this.jsonLdPackages,
      classes: this.jsonLdClasses,
      dataTypes: this.jsonLdDataTypes,
      contributors: this.contributors,
      editors: this.editors,
      authors: this.authors,
    };
  }
}
