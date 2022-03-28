import alasql from 'alasql';
import type MDBReader from 'mdb-reader';
import { EaTable } from './DataExtractor';
import { ElementType } from './types/EaElement';
import type { EaElement } from './types/EaElement';

export function loadElements(reader: MDBReader): EaElement[] {
  const objects = reader.getTable(EaTable.Object).getData();
  const query = `
    SELECT Object_ID, Object_Type, Name, Note, Package_ID, Stereotype, ea_guid
    FROM ? object
    WHERE Object_Type IN ('Class', 'DataType', 'Enumeration')`;

  return (<any[]>alasql(query, [objects])).map(item => <EaElement>{
    id: <number>item.Object_ID,
    type: getElementType(<string>item.Object_Type),
    name: <string>item.Name,
    packageId: <number>item.Package_ID,
    guid: <string>item.ea_guid,
  });
}

function getElementType(type: string): ElementType {
  switch (type) {
    case 'Class':
      return ElementType.Class;

    case 'DataType':
      return ElementType.DataType;

    case 'Enumeration':
      return ElementType.Enumeration;

    default:
      throw new Error(`Invalid element type: ${type}`);
  }
}
