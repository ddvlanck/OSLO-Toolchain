import type { OutputHandler } from '@oslo-flanders/core';
import { ns } from '@oslo-flanders/core';
import { ConverterHandler } from '../types/ConverterHandler';
import type { NormalizedConnector } from '../types/NormalizedConnector';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';

// See comment in attribute handler about strategy

export class ConnectorConverterHandler extends ConverterHandler<NormalizedConnector> {
  public async addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): Promise<void> {
    const targetDiagram = this.converter.getTargetDiagram();

    const connectorIdUriMap = uriAssigner.connectorIdUriMap;
    const elementUriMap = uriAssigner.elementIdUriMap;
    const packageUri = uriAssigner.packageIdUriMap.get(targetDiagram.packageId)!;

    const diagramConnectors = this.converter.getConnectors()
      .filter(x => targetDiagram.connectorsIds.includes(x.innerConnectorId));

    diagramConnectors.forEach(connector => {
      const connectorUri = connectorIdUriMap.get(connector.id);

      if (!connectorUri) {
        // Log error
        return;
      }

      const connectorUriNamedNode = this.factory.namedNode(connectorUri);

      // Publish a unique reference of this attribute
      const uniqueInternalIdNamedNode = ns.example(`.well-known/${connector.internalGuid}`);
      outputHandler.add(uniqueInternalIdNamedNode, ns.example('guid'), connectorUriNamedNode);

      outputHandler.add(uniqueInternalIdNamedNode, ns.rdf('type'), ns.owl('ObjectProperty'));

      const definition = this.getDefinition(connector);
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('comment'), definition);

      const label = this.getLabel(connector);
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('label'), label);

      const usageNote = this.getUsageNote(connector);
      outputHandler.add(uniqueInternalIdNamedNode, ns.vann('usageNote'), usageNote);

      const domainWellKnownId = this.converter.getElements().find(x => x.id === connector.sourceObjectId)?.internalGuid;
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('domain'), ns.example(`.well-known/${domainWellKnownId}`));

      const rangeWellKnownId = this.converter.getElements()
        .find(x => x.id === connector.destinationObjectId)?.internalGuid;
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('range'), ns.example(`.well-known/${rangeWellKnownId}`));

      const scope = this.getScope(connector, packageUri, connectorIdUriMap);
      // TODO: remove example.org
      const scopeLiteral = this.factory.literal(scope);
      outputHandler.add(uniqueInternalIdNamedNode, ns.example('scope'), scopeLiteral);

      let minCardinality;
      let maxCardinality;

      if (connector.cardinality.includes('..')) {
        [minCardinality, maxCardinality] = connector.cardinality.split('..');
      } else {
        minCardinality = maxCardinality = connector.cardinality;
      }

      const minCardLiteral = this.factory.literal(minCardinality);
      const maxCardLiteral = this.factory.literal(maxCardinality);
      outputHandler.add(uniqueInternalIdNamedNode, ns.shacl('minCount'), minCardLiteral);
      outputHandler.add(uniqueInternalIdNamedNode, ns.shacl('maxCount'), maxCardLiteral);

      const parentUri = getTagValue(connector, TagName.ParentUri, null);
      if (parentUri) {
        outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('subPropertyOf'), this.factory.namedNode(parentUri));
      }
    });
  }
}
