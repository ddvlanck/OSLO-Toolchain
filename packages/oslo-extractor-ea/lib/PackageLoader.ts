import alasql from 'alasql';
import type MDBReader from 'mdb-reader';
import { EaTable } from './DataExtractor';
import type { EaPackage } from './types/EaPackage';

export function loadPackages(eaReader: MDBReader): EaPackage[] {
  const packages = eaReader.getTable(EaTable.Package).getData();
  const elements = eaReader.getTable(EaTable.Object).getData();

  const query = `
    SELECT package.Package_ID, package.Name, package.Parent_ID, package.ea_guid, element.Object_ID, element.Stereotype, element.Note
    FROM ? package
    LEFT JOIN ? element ON package.ea_guid = element.ea_guid`;

  // TODO: add stereotype and note
  const eaPackages = (<any[]>alasql(query, [packages, elements])).map(item => <EaPackage>{
    id: <number>item.Object_ID,
    name: <string>item.Name,
    packageId: <number>item.Package_ID,
    parentId: <number>item.Parent_ID,
    guid: <string>item.ea_guid,
  });

  return eaPackages;
}
