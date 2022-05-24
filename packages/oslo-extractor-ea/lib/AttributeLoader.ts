import { getLoggerFor } from '@oslo-flanders/core';
import type MDBReader from 'mdb-reader';
import { EaAttribute } from './types/EaAttribute';
import type { EaElement } from './types/EaElement';
import { EaTable } from './types/TableNames';
import { addEaTagsToElements } from './utils/tag';

/**
 * Converts JSON data from attribute table to EaAttributes.
 * @param reader - The UML reader containing the Enterprise Architect file.
 * @param elementsIds - The element identifiers, used to verify that each attribute belongs to an EaElement.
 * @returns an array of EaAttributes
 */
export function loadAttributes(reader: MDBReader, elements: EaElement[]): EaAttribute[] {
  const attributes = reader.getTable(EaTable.Attribute).getData();
  const elementIds = new Set(elements.map(x => x.id));

  const eaAttributes = attributes.reduce((attributesArray: EaAttribute[], attribute: any): EaAttribute[] => {
    // Verification that each attribute is linked to a class
    if (elementIds.has(<number>attribute.Object_ID)) {
      attributesArray.push(new EaAttribute(
        <number>attribute.ID,
        <string>attribute.ea_guid,
        <string>attribute.Name,
        <number>attribute.Object_ID,
        <string>attribute.Type,
        <string>attribute.LowerBound,
        <string>attribute.UpperBound,
      ));
    }

    return attributesArray;
  }, []);

  eaAttributes.forEach(attribute => setPath(attribute, elements));

  const attributeTags = reader.getTable(EaTable.AttributeTag).getData();
  addEaTagsToElements(attributeTags, eaAttributes, 'ElementID', 'VALUE');

  return eaAttributes;
}

function setPath(attribute: EaAttribute, elements: EaElement[]): void {
  const logger = getLoggerFor(`AttributeLoader`);
  const eaClass = elements.find(x => x.id === attribute.classId);
  let path: string;

  if (!eaClass) {
    logger.warn(`Unable to find class for attribute with guid ${attribute.eaGuid}. Setting path to '${attribute.name}'.`);
    path = attribute.name;
  } else {
    path = `${eaClass.path()}:${attribute.name}`;
  }

  attribute.setPath(path);
}
