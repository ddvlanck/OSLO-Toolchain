import { readFile, stat } from 'fs/promises';
import { Logger } from '@oslo-flanders/types';
import MDBReader from 'mdb-reader';
import type { EaAttribute } from './types/EaAttribute';
import type { EaClass } from './types/EaClass';
import type { EaConnector } from './types/EaConnector';
import { EaDocument } from './types/EaDocument';
import type { EaPackage } from './types/EaPackage';
import { addEaTagsToElements, addRoleTagsToElements } from './utils/tag';

// eslint-disable-next-line import/no-commonjs
const fetch = require('node-fetch');

export class DataExtractor {
  public file: string;
  private readonly logger = Logger.getInstanceFor(this);

  public constructor(file: string) {
    this.file = file;
  }

  public async extractData(): Promise<EaDocument> {
    this.logger.info(`Start extraction data from ${this.file}`);

    const buffer = await this.fetchFileOrUrl();
    const eaReader = new MDBReader(buffer);

    const [connectors, attributes, [packages, classes]] =
      await Promise.all([
        this.extractConnectorsAndTags(eaReader),
        this.extractAttributesAndTags(eaReader),
        this.extractClassesAndPackagesAndTags(eaReader)]);

    return new EaDocument(connectors, classes, attributes, packages);
  }

  private async extractConnectorsAndTags(reader: MDBReader): Promise<EaConnector[]> {
    const connectors = reader.getTable('t_connector').getData();
    const eaConnectors = connectors.map(connector => <EaConnector>{
      id: connector.Connector_ID,
      sourceObjectId: connector.Start_Object_ID,
      destinationObjectId: connector.End_Object_ID,
      name: connector.Name ? connector.Name : undefined,
      type: connector.Connector_Type,
      sourceCardinality: connector.SourceCard,
      destinationCardinality: connector.DestCard,
      sourceRole: connector.SourceRole,
      destinationRole: connector.DestRole,
      associationClassId: connector.SubType === 'Class' ? Number.parseInt(<string>connector.PDATA1, 10) : undefined,
      guid: connector.ea_guid,
    });

    const connectorTags = reader.getTable('t_connectortag').getData();
    addEaTagsToElements(connectorTags, eaConnectors, 'ElementID', 'VALUE');

    const roleTags = reader.getTable('t_taggedvalue').getData();
    addRoleTagsToElements(roleTags, eaConnectors);

    return eaConnectors;
  }

  private async extractClassesAndPackagesAndTags(reader: MDBReader): Promise<[EaPackage[], EaClass[]]> {
    const objects = reader.getTable('t_object').getData();

    const eaPackages: EaPackage[] = [];
    const eaClasses: EaClass[] = [];

    objects.forEach(object => {
      if (object.Object_Type === 'Package') {
        const eaPackage: EaPackage = {
          id: <number>object.Object_ID,
          name: <string>object.Name,
          packageId: <number>object.Package_ID,
          parentId: <number>object.ParentID,
        };

        eaPackages.push(eaPackage);
      }

      if (object.Object_Type === 'Class') {
        const eaClass: EaClass = {
          id: <number>object.Object_ID,
          name: <string>object.Name,
        };

        eaClasses.push(eaClass);
      }
    });

    const objectTags = reader.getTable('t_objectproperties').getData();
    addEaTagsToElements(objectTags, [...eaClasses, ...eaPackages], 'Object_ID', 'Value');

    return [eaPackages, eaClasses];
  }

  private async extractAttributesAndTags(reader: MDBReader): Promise<EaAttribute[]> {
    const attributes = reader.getTable('t_attribute').getData();
    const eaAttributes: EaAttribute[] = attributes.map(attribute => <EaAttribute>{
      id: attribute.ID,
      classId: attribute.Object_ID,
      name: attribute.Name,
      type: attribute.Type,
      lowerBound: attribute.LowerBound,
      upperBound: attribute.UpperBound,
    });

    const attributeTags = reader.getTable('t_attributetag').getData();
    addEaTagsToElements(attributeTags, eaAttributes, 'ElementID', 'VALUE');

    return eaAttributes;
  }

  private async fetchFileOrUrl(): Promise<Buffer> {
    if (this.file.startsWith('http://') || this.file.startsWith('https://')) {
      return (await fetch(this.file)).buffer();
    }
    if (this.file.startsWith('file://')) {
      this.file = this.file.slice(7);
    }
    if (!(await stat(this.file)).isFile()) {
      throw new Error(`Path does not refer to a valid file: ${this.file}`);
    }
    // FIXME: handle all paths
    return readFile(this.file);
  }
}
