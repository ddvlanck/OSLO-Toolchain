import type { OutputHandler } from '@oslo-flanders/core';
import type { EaConnector, EaDocument, EaElement } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import type { NormalizedConnector } from '../types/NormalizedConnector';
import { NormalizedConnectorType } from '../types/NormalizedConnector';
import type { UriAssigner } from '../UriAssigner';
import { ignore, normalize } from '../utils/utils';

export class ConnectorConverterHandler extends ConverterHandler {
  public documentNotification(document: EaDocument): void {
    const diagramConnectors = document.eaConnectors.filter(x => this.targetDiagram.connectorsIds.includes(x.id));
    const filteredConnectors = diagramConnectors.filter(x => !ignore(x, false));
    this.objects = this.normalizeConnectors(filteredConnectors, document.eaElements);
  }

  public convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    console.log(`Method is not yet implemented`);
  }

  private normalizeConnectors(connectors: EaConnector[], elements: EaElement[]): NormalizedConnector[] {
    const normalizedConnectors: NormalizedConnector[] = [];

    connectors.forEach(connector => {
      const normalized = normalize(connector, elements);
      normalizedConnectors.push(...normalized);
    });

    // Add names for the association class connectors
    normalizedConnectors.forEach(connector => {
      if (connector.type === NormalizedConnectorType.AssociationClassConnector) {
        const destinationClass = elements.find(x => x.id === connector.destinationObjectId);

        if (!destinationClass) {
          // TODO: Log warning
          console.log(`Can't find object for id ${connector.destinationObjectId}.`);
        } else {
          connector.addNameTag(destinationClass.name);
        }
      }
    });

    return normalizedConnectors;
  }
}
