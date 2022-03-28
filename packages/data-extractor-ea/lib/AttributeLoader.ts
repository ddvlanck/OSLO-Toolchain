import type MDBReader from 'mdb-reader';
import { EaTable } from './DataExtractor';
import type { EaAttribute } from './types/EaAttribute';
import { addEaTagsToElements } from './utils/tag';

/**
 * Converts JSON data from attribute table to EaAttributes.
 * @param reader - The UML reader containing the Enterprise Architect file.
 * @param elementsIds - The element identifiers, used to verify that each attribute belongs to an EaElement.
 * @returns an array of EaAttributes
 */
export function loadAttributes(reader: MDBReader, elementsIds: number[]): EaAttribute[] {
  const attributes = reader.getTable(EaTable.Attribute).getData();

  const eaAttributes = attributes.reduce((attributesArray: EaAttribute[], attribute: any): EaAttribute[] => {
    // Verification that each attribute is linked to a class
    if (elementsIds.includes(<number>attribute.Object_ID)) {
      attributesArray.push({
        id: <number>attribute.ID,
        classId: <number>attribute.Object_ID,
        name: <string>attribute.Name,
        type: <string>attribute.Type,
        lowerBound: <string>attribute.LowerBound,
        upperBound: <string>attribute.UpperBound,
        guid: <string>attribute.ea_guid,
      });
    }

    return attributesArray;
  }, []);

  const attributeTags = reader.getTable(EaTable.AttributeTag).getData();
  addEaTagsToElements(attributeTags, eaAttributes, 'ElementID', 'VALUE');

  return eaAttributes;
}
