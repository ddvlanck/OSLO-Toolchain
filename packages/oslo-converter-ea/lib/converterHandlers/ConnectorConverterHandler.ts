import type { OutputHandler } from '@oslo-flanders/core';
import { ns } from '@oslo-flanders/core';
import { ConverterHandler } from '../types/ConverterHandler';
import type { NormalizedConnector } from '../types/NormalizedConnector';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';

export class ConnectorConverterHandler extends ConverterHandler<NormalizedConnector> {
  public addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
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
      outputHandler.add(connectorUriNamedNode, ns.rdf('type'), ns.owl('ObjectProperty'));

      const definition = this.getDefinition(connector);
      outputHandler.add(connectorUriNamedNode, ns.rdfs('comment'), definition);

      const label = this.getLabel(connector);
      outputHandler.add(connectorUriNamedNode, ns.rdfs('label'), label);

      const usageNote = this.getUsageNote(connector);
      outputHandler.add(connectorUriNamedNode, ns.vann('usageNote'), usageNote);

      const domain = elementUriMap.get(connector.sourceObjectId)!;
      const domainNamedNode = this.factory.namedNode(domain);
      outputHandler.add(connectorUriNamedNode, ns.rdfs('domain'), domainNamedNode);

      const range = elementUriMap.get(connector.destinationObjectId)!;
      const rangeNamedNode = this.factory.namedNode(range);
      outputHandler.add(connectorUriNamedNode, ns.rdfs('range'), rangeNamedNode);

      const scope = this.getScope(connector, packageUri, connectorIdUriMap);
      // TODO: remove example.org
      const scopeLiteral = this.factory.literal(scope);
      outputHandler.add(connectorUriNamedNode, ns.example('scope'), scopeLiteral);

      let minCardinality;
      let maxCardinality;

      if (connector.cardinality.includes('..')) {
        [minCardinality, maxCardinality] = connector.cardinality.split('..');
      } else {
        minCardinality = maxCardinality = connector.cardinality;
      }

      const minCardLiteral = this.factory.literal(minCardinality);
      const maxCardLiteral = this.factory.literal(maxCardinality);
      outputHandler.add(connectorUriNamedNode, ns.shacl('minCount'), minCardLiteral);
      outputHandler.add(connectorUriNamedNode, ns.shacl('maxCount'), maxCardLiteral);

      const parentUri = getTagValue(connector, TagName.ParentUri, null);
      if (parentUri) {
        outputHandler.add(connectorUriNamedNode, ns.rdfs('subPropertyOf'), this.factory.namedNode(parentUri));
      }
    });
  }
}
