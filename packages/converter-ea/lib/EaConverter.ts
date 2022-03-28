import type { Configuration } from '@oslo-flanders/ea-converter-configuration';
import type { EaConnector, EaDiagram, EaDocument } from '@oslo-flanders/ea-data-extractor';
import { ConnectorDirection, DataExtractor } from '@oslo-flanders/ea-data-extractor';

import { Converter, getLoggerFor } from '@oslo-flanders/types';
import { UriAssigner } from './UriAssigner';
import { extractAssociationElement, ignore } from './utils/utils';

export class EaConverter extends Converter {
  private readonly logger = getLoggerFor(this);

  private readonly extractor: DataExtractor;
  private readonly configuration: Configuration;

  // FIXME: outputhandler should be added as parameter as well
  public constructor(configuration: Configuration) {
    super(configuration.umlFile);

    this.configuration = configuration;
    this.extractor = new DataExtractor(this.configuration.umlFile);
  }

  public async convert(): Promise<any> {
    const eaDocument = await this.extractor.extractData();
    const targetDiagram = this.getTargetDiagram(eaDocument);

    if (!targetDiagram) {
      return;
    }

    const filteredPackages = eaDocument.eaPackages.filter(x => !ignore(x, false));
    const filteredElements = eaDocument.eaElements.filter(x => !ignore(x, false));
    const filteredAttributes = eaDocument.eaAttributes.filter(x => !ignore(x, false));

    // This.connectorToDirectionMap(targetDiagram, eaDocument.eaConnectors);

    const uriAssigner = new UriAssigner();
    uriAssigner.assignUris(
      targetDiagram,
      filteredPackages,
      filteredElements,
      filteredAttributes,
      eaDocument.eaConnectors,
    );
  }

  private getTargetDiagram(eaDocument: EaDocument): EaDiagram | null {
    const filteredDiagram = eaDocument.eaDiagrams.filter(x => x.name === this.configuration.diagramName);

    if (filteredDiagram.length > 1) {
      this.logger.error(`Multiple diagrams share the same name '${this.configuration.diagramName}'. Aborting conversion.`);
      return null;
    }

    if (filteredDiagram.length === 0) {
      this.logger.error(`UML model does not contain a diagram with name ${this.configuration.diagramName}.`);
      return null;
    }

    return filteredDiagram[0];
  }

  private connectorToDirectionMap(diagram: EaDiagram, connectors: EaConnector[]): Map<EaConnector, ConnectorDirection> {
    const diagramConnectors: EaConnector[] = [];
    const connectorToDirectionMap: Map<EaConnector, ConnectorDirection> = new Map();

    diagram.connectorsIds.forEach(connectorId => {
      const connector = connectors.find(x => x.id === connectorId)!;
      diagramConnectors.push(connector);
    });

    diagramConnectors.forEach(diagramConnector => {
      let direction = diagramConnector.diagramGeometryDirection;

      if (direction === ConnectorDirection.Unspecified) {
        direction = diagramConnector.direction;
      }

      connectorToDirectionMap.set(diagramConnector, direction);

      if (diagramConnector.associationClassId) {
        const associationConnectors = extractAssociationElement(diagramConnector, direction);
        associationConnectors.forEach(associationConnector =>
          connectorToDirectionMap.set(associationConnector, associationConnector.direction));
      } else if (direction === ConnectorDirection.Unspecified || direction === ConnectorDirection.Bidirectional) {
        const associationConnectors = extractAssociationElement(diagramConnector, direction);
        associationConnectors.forEach(associationConnector => {
          if (connectorToDirectionMap.has(associationConnector)) {
            this.logger.warn(`Connector (${associationConnector.guid}) without explicit direction already added to the set of directions`);
          } else {
            connectorToDirectionMap.set(associationConnector, associationConnector.direction);
          }
        });
      }
    });

    return connectorToDirectionMap;
  }
}
