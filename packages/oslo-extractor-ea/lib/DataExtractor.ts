import { fetchFileOrUrl, getLoggerFor } from '@oslo-flanders/core';
import MDBReader from 'mdb-reader';
import { loadAttributes } from './AttributeLoader';
import { loadDiagrams } from './DiagramLoader';
import { loadElementConnectors } from './ElementConnectorLoader';
import { loadElements } from './ElementLoader';
import { loadPackages } from './PackageLoader';
import { EaDocument } from './types/EaDocument';
import { addEaTagsToElements } from './utils/tag';

// FIXME: what to do with imported packages (see ap Persoon)

export class DataExtractor {
  private readonly file: string;
  private readonly logger = getLoggerFor(this);

  public constructor(file: string) {
    this.file = file;
  }

  public async extractData(): Promise<EaDocument> {
    this.logger.info(`Start extraction data from ${this.file}`);

    const buffer = await fetchFileOrUrl(this.file);
    const eaReader = new MDBReader(buffer);

    const packages = loadPackages(eaReader);
    const elements = loadElements(eaReader, packages);

    // Object tags contains tags for packages and elements.
    // If tags are added in the load function, then warnings are logged because one is not present
    const objectTags = eaReader.getTable(EaTable.ClassAndPackageTag).getData();
    addEaTagsToElements(objectTags, [...packages, ...elements], 'Object_ID', 'Value');

    const attributes = loadAttributes(eaReader, elements);
    const elementConnectors = loadElementConnectors(eaReader, elements);
    const diagrams = loadDiagrams(eaReader, elementConnectors, packages);

    return new EaDocument(elementConnectors, attributes, elements, packages, diagrams);
  }
}
