import alasql from 'alasql';
import type MDBReader from 'mdb-reader';
import { EaTable } from './DataExtractor';
import type { EaConnector } from './types/EaConnector';
import { ConnectorDirection } from './types/EaConnector';
import type { EaDiagram } from './types/EaDiagram';
import { resolveConnectorDirection } from './utils/connectorDirectionResolver';

export function loadDiagrams(reader: MDBReader, elementConnectors: EaConnector[]): EaDiagram[] {
  const diagrams = reader.getTable(EaTable.Diagram).getData();

  const eaDiagrams = diagrams.map(item => <EaDiagram>{
    id: <number>item.Diagram_ID,
    packageId: <number>item.Package_ID,
    name: <string>item.Name,
    guid: <string>item.ea_guid,
  });

  loadDiagramObjects(reader, eaDiagrams);
  loadDiagramConnectors(reader, eaDiagrams, elementConnectors);

  return eaDiagrams;
}

function loadDiagramObjects(reader: MDBReader, diagrams: EaDiagram[]): void {
  const diagramObjects = reader.getTable(EaTable.DiagramObject).getData();
  const objects = reader.getTable(EaTable.Object).getData();

  const query = `
    SELECT Diagram_ID, Object_ID
    FROM ? diagramObject
    INNER JOIN ? object ON diagramObject.Object_ID = object.Object_ID
    WHERE object.Object_Type IN ('Class', 'DataType', 'Enumeration')`;

  const filteredDiagramObjects = <any[]>alasql(query, [diagramObjects, objects]);
  filteredDiagramObjects.forEach(diagramObject => {
    const diagram = diagrams.find(x => x.id === diagramObject.Diagram_ID);

    if (!diagram) {
      // TODO: log error or warning
    } else {
      diagram.elementIds = diagram.elementIds ?
        [...diagram.elementIds, diagramObject.Object_ID] :
        [diagramObject.Object_ID];
    }
  });
}

function loadDiagramConnectors(reader: MDBReader, diagrams: EaDiagram[], elementConnectors: EaConnector[]): void {
  const diagramConnectors = reader.getTable(EaTable.DiagramLink).getData();

  diagramConnectors.forEach(diagramConnector => {
    const diagram = diagrams.find(x => x.id === diagramConnector.DiagramID);

    if (!diagram) {
      // TODO: log error?
      console.log(`Diagram not found for ${JSON.stringify(diagramConnector, null, 4)}`);
      return;
    }

    let direction = ConnectorDirection.Unspecified;

    if (diagramConnector.Geometry === null) {
      // TODO: log error
      return;
    }
    direction = resolveConnectorDirection(<string>diagramConnector.Geometry);

    const connector = elementConnectors.find(x => x.id === diagramConnector.ConnectorID);

    if (!connector) {
      // TODO: log error
      return;
    }

    connector.diagramGeometryDirection = direction;
    connector.hidden = <boolean>diagramConnector.Hidden;

    diagram.connectorsIds = diagram.connectorsIds ?
      [...diagram.connectorsIds, <number>diagramConnector.ConnectorID] :
      [<number>diagramConnector.ConnectorID];
  });
}
