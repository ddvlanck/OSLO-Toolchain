import alasql from 'alasql';
import type MDBReader from 'mdb-reader';
import { EaTable } from './DataExtractor';
import type { EaConnector } from './types/EaConnector';
import { convertToConnectorDirection } from './utils/connectorDirectionResolver';
import { addEaTagsToElements, addRoleTagsToElements } from './utils/tag';

export function loadElementConnectors(reader: MDBReader): EaConnector[] {
  const connectors = reader.getTable(EaTable.Connector).getData();
  const objects = reader.getTable(EaTable.Object).getData();

  const query = `
    SELECT connector.Connector_ID, 
      connector.Name, 
      connector.Direction, 
      connector.Notes, 
      connector.Connector_Type, 
      connector.SourceRole, 
      connector.DestRole, 
      connector.Start_Object_ID, 
      connector.End_Object_ID, 
      connector.PDATA1, 
      connector.ea_guid, 
      connector.SourceCard, 
      connector.DestCard
    FROM ? connector
      INNER JOIN ? source ON connector.Start_Object_ID = source.Object_ID
      INNER JOIN ? destination ON connector.End_Object_ID = destination.Object_ID
    WHERE source.Object_Type in ('Class', 'DataType', 'Enumeration')
      AND destination.Object_Type in ('Class', 'DataType', 'Enumeration')`;

  const eaConnectors = (<any[]>alasql(query, [connectors, objects, objects])).map(item => <EaConnector>{
    id: <number>item.Connector_ID,
    name: <string>item.Name ? <string>item.Name : undefined,
    type: <string>item.Connector_Type,
    direction: convertToConnectorDirection(<string>item.Direction),
    sourceObjectId: <number>item.Start_Object_ID,
    destinationObjectId: <number>item.End_Object_ID,
    sourceCardinality: <string>item.SourceCard,
    destinationCardinality: <string>item.DestCard,
    sourceRole: <string>item.SourceRole,
    destinationRole: <string>item.DestRole,
    guid: <string>item.ea_guid,
    associationClassId: Number.parseInt(<string>item.PDATA1, 10) || null,
  });

  const connectorTags = reader.getTable(EaTable.ConnectorTag).getData();
  addEaTagsToElements(connectorTags, eaConnectors, 'ElementID', 'VALUE');

  const roleTags = reader.getTable(EaTable.ConnectorRoleTag).getData();
  addRoleTagsToElements(roleTags, eaConnectors);

  return eaConnectors;
}
