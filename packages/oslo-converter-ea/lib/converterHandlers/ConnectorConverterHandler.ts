import type { OutputHandler, Property } from '@oslo-flanders/core';
import { PropertyType } from '@oslo-flanders/core';
import type { EaConverter } from '../EaConverter';
import { ConverterHandler } from '../types/ConverterHandler';
import type { NormalizedConnector } from '../types/NormalizedConnector';
import type { UriAssigner } from '../UriAssigner';

export class ConnectorConverterHandler extends ConverterHandler<NormalizedConnector> {
  public constructor(converter: EaConverter) {
    super(converter);
  }

  public createOsloObject(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const targetDiagram = this.converter.getTargetDiagram();
    const connectorIdUriMap = uriAssigner.connectorIdUriMap;
    const elementUriMap = uriAssigner.elementIdUriMap;
    const packageUri = uriAssigner.packageIdUriMap.get(targetDiagram.packageId)!;

    this.converter.getConnectors().forEach(connector => {
      const connectorUri = connectorIdUriMap.get(connector.id);

      if (!connectorUri) {
        // Log error
        return;
      }

      const definition = this.getDefinition(connector);
      const label = this.getLabel(connector);
      const usageNote = this.getUsageNote(connector);
      const domain = elementUriMap.get(connector.sourceObjectId)!;
      const domainLabel = this.converter.getElements().find(x => x.id === connector.sourceObjectId)!.name;
      const range = elementUriMap.get(connector.destinationObjectId)!;
      const scope = this.getScope(connector, packageUri, connectorIdUriMap);
      const [minCardinality, maxCardinality] = connector.cardinality.split('..');

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
}
