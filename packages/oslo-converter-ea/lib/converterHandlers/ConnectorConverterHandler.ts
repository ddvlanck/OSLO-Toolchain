import type { OutputHandler, Property } from '@oslo-flanders/core';
import { PropertyType } from '@oslo-flanders/core';
import type { EaConnector, EaDiagram, EaDocument, EaElement } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import type { NormalizedConnector } from '../types/NormalizedConnector';
import { NormalizedConnectorType } from '../types/NormalizedConnector';
import type { UriAssigner } from '../UriAssigner';
import { ignore, normalize } from '../utils/utils';

export class ConnectorConverterHandler extends ConverterHandler<EaConnector | NormalizedConnector> {
  private elements: EaElement[];

  public constructor(targetDiagram: EaDiagram, specificationType: string, targetDomain: string) {
    super(targetDiagram, specificationType, targetDomain);
    this.elements = [];
  }

  public documentNotification(document: EaDocument): void {
    const diagramConnectors = document.eaConnectors.filter(x => this.targetDiagram.connectorsIds.includes(x.id));
    const filteredConnectors = diagramConnectors.filter(x => !ignore(x, false));
    this.objects = this.normalizeConnectors(filteredConnectors, document.eaElements);
    this.elements = document.eaElements;
  }

  public createOsloObject(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const connectorIdUriMap = uriAssigner.connectorIdUriMap;
    const elementUriMap = uriAssigner.elementIdUriMap;
    const packageUri = uriAssigner.packageIdUriMap.get(this.targetDiagram.packageId)!;

    this.objects.forEach(connector => {
      const normalizedConnector = <NormalizedConnector>connector;

      const connectorUri = connectorIdUriMap.get(normalizedConnector.id);

      if (!connectorUri) {
        // Log error
        return;
      }

      const definition = this.getDefinition(normalizedConnector);
      const label = this.getLabel(normalizedConnector);
      const usageNote = this.getUsageNote(normalizedConnector);
      const domain = elementUriMap.get(normalizedConnector.sourceObjectId)!;
      const domainLabel = this.elements.find(x => x.id === normalizedConnector.sourceObjectId)!.name;
      const range = elementUriMap.get(normalizedConnector.destinationObjectId)!;
      const scope = this.getScope(normalizedConnector, packageUri, connectorIdUriMap);
      const [minCardinality, maxCardinality] = normalizedConnector.cardinality.split('..');

      const osloConnector: Property = {
        uri: new URL(connectorUri),
        definition,
        label,
        usageNote,
        domain,
        domainLabel,
        minCardinality,
        maxCardinality,
        type: PropertyType.ObjectProperty,
        range,
        scope,
      };

      outputHandler.addAttribute(osloConnector);
    });
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
