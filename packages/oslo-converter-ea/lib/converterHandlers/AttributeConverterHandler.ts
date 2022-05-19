import type { OutputHandler } from '@oslo-flanders/core';
import { ns, PropertyType } from '@oslo-flanders/core';

import type { EaAttribute } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import { DataTypes } from '../types/DataTypes';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';

export class AttributeConverterHandler extends ConverterHandler<EaAttribute> {
  public addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const attributeUriMap = uriAssigner.attributeIdUriMap;
    const elementUriMap = uriAssigner.elementIdUriMap;
    const elementNameToElementMap = uriAssigner.elementNameToElementMap;
    const packageUri = uriAssigner.packageIdUriMap.get(this.converter.getTargetDiagram().packageId)!;

    const diagramAttributes = this.converter.getAttributes()
      .filter(x => this.converter.getTargetDiagram().elementIds.includes(x.classId));

    diagramAttributes.forEach(attribute => {
      const attributeUri = attributeUriMap.get(attribute.id);

      if (!attributeUri) {
        // Log errr
        return null;
      }

      const attributeUriNamedNode = this.factory.namedNode(attributeUri);

      let range = getTagValue(attribute, TagName.Range, null);
      let attributeType: PropertyType;
      let rangeLabel: string | undefined;

      // TODO: range should have a label, but how does is work when range is added through a tag?
      // TODO: rangeLabels should be added to store as well.

      if (range) {
        const isLiteral = getTagValue(attribute, TagName.IsLiteral, false);
        attributeType = isLiteral === 'true' ? PropertyType.DataTypeProperty : PropertyType.ObjectProperty;
      } else if (DataTypes.has(attribute.type)) {
        attributeType = PropertyType.DataTypeProperty;
        range = DataTypes.get(attribute.type)!;
        rangeLabel = attribute.type;
      } else if (elementNameToElementMap.has(attribute.type)) {
        const elements = elementNameToElementMap.get(attribute.type)!;

        if (elements && elements.length > 1) {
          // Log warning
        }

        const element = elements[0];
        const elementIsLiteral = getTagValue(element, TagName.IsLiteral, false);

        attributeType = elementIsLiteral === 'true' ? PropertyType.DataTypeProperty : PropertyType.ObjectProperty;
        range = elementUriMap.get(element.id)!;
        rangeLabel = attribute.type;
      } else {
        attributeType = PropertyType.Property;
      }

      outputHandler.add(attributeUriNamedNode, ns.rdf('type'), this.factory.namedNode(attributeType));

      const rangeNamedNode = this.factory.namedNode(range);
      outputHandler.add(attributeUriNamedNode, ns.rdfs('range'), rangeNamedNode);

      // It is possible that this triple was already added in ElementConverterHandler, so don't add it again
      if (rangeLabel && !outputHandler.exists(rangeNamedNode, ns.rdfs('label'))) {
        outputHandler.add(rangeNamedNode, ns.rdfs('label'), this.factory.literal(rangeLabel));
      }

      // TODO: handle subproperties
      // TODO: derived not yet available

      const definition = this.getDefinition(attribute);
      outputHandler.add(attributeUriNamedNode, ns.rdfs('comment'), definition);

      const label = this.getLabel(attribute);
      outputHandler.add(attributeUriNamedNode, ns.rdfs('label'), label);

      const usageNote = this.getUsageNote(attribute);
      outputHandler.add(attributeUriNamedNode, ns.vann('usageNote'), usageNote);

      const domain = elementUriMap.get(attribute.classId)!;
      outputHandler.add(attributeUriNamedNode, ns.rdfs('domain'), this.factory.namedNode(domain));

      const scope = this.getScope(attribute, packageUri, attributeUriMap);
      // TODO: remove example.org
      const scopeLiteral = this.factory.literal(scope);
      outputHandler.add(attributeUriNamedNode, ns.example('scope'), scopeLiteral);

      outputHandler.add(attributeUriNamedNode, ns.shacl('minCount'), this.factory.literal(attribute.lowerBound));
      outputHandler.add(attributeUriNamedNode, ns.shacl('maxCount'), this.factory.literal(attribute.upperBound));
    });
  }
}
