import type { OutputHandler } from '@oslo-flanders/core';
import { ns, PropertyType } from '@oslo-flanders/core';

import type { EaAttribute } from '@oslo-flanders/ea-extractor';
import { NotificationMessage } from '../EaConverter';
import { ConverterHandler } from '../types/ConverterHandler';
import { DataTypes } from '../types/DataTypes';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';

// We add the quads to the N3.Store with their well-known id instead of their original
// assigned URI. Doing this ensures that each 'object' is uniquely identified (not the case
// when skos:Concept is used for example) and that we can extract additional information
// for domain and range.
// The output handler will substitute then replace well-known id with the assigned URI

export class AttributeConverterHandler extends ConverterHandler<EaAttribute> {
  public async addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): Promise<void> {
    const attributeUriMap = uriAssigner.attributeIdUriMap;
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

      // Publish a unique reference of this attribute
      const uniqueInternalIdNamedNode = ns.example(`.well-known/${attribute.internalGuid}`);
      outputHandler.add(uniqueInternalIdNamedNode, ns.example('guid'), attributeUriNamedNode);

      let range = getTagValue(attribute, TagName.Range, null);
      let attributeType: PropertyType;
      let rangeLabel: string | undefined;

      // 1. Check if there was a range tag
      // 2. If not, check if attribute type belongs to DataTypes (primitive types)
      // 3. If not, check if range is an EaElement
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
          // TODO: log warning
        }

        const element = elements[0];
        const elementIsLiteral = getTagValue(element, TagName.IsLiteral, false);

        attributeType = elementIsLiteral === 'true' ? PropertyType.DataTypeProperty : PropertyType.ObjectProperty;
        // In case an element is references that is not included on the target diagram
        // We still add it to the output handler
        if (!this.converter.getTargetDiagram().elementIds.includes(element.id)) {
          this.converter.notify(NotificationMessage.AddElementToOutput, element);
        }

        range = ns.example(`.well-known/${element.internalGuid}`).value;
        rangeLabel = attribute.type;
      } else {
        attributeType = PropertyType.Property;
      }

      outputHandler.add(uniqueInternalIdNamedNode, ns.rdf('type'), this.factory.namedNode(attributeType));

      const rangeNamedNode = this.factory.namedNode(range);
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('range'), rangeNamedNode);

      // Add rangeLabel to the N3.Store if it is not added yet.
      // E.g. when type is string with label 'String', this is only known in the attribute itself
      // So this triple must be added to the store here.
      if (rangeLabel && !rangeNamedNode.value.startsWith(ns.example('.well-known')) &&
        !outputHandler.exists(rangeNamedNode, ns.rdfs('label'))) {
        outputHandler.add(rangeNamedNode, ns.rdfs('label'), this.factory.literal(rangeLabel));
      }

      const definition = this.getDefinition(attribute);
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('comment'), definition);

      const label = this.getLabel(attribute);
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('label'), label);

      const usageNote = this.getUsageNote(attribute);
      outputHandler.add(uniqueInternalIdNamedNode, ns.vann('usageNote'), usageNote);

      const domainWellKnownId = this.converter.getElements().find(x => x.id === attribute.classId)?.internalGuid;
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('domain'), ns.example(`.well-known/${domainWellKnownId}`));

      const scope = this.getScope(attribute, packageUri, attributeUriMap);
      // TODO: remove example.org
      const scopeLiteral = this.factory.literal(scope);
      outputHandler.add(uniqueInternalIdNamedNode, ns.example('scope'), scopeLiteral);

      outputHandler.add(uniqueInternalIdNamedNode, ns.shacl('minCount'), this.factory.literal(attribute.lowerBound));
      outputHandler.add(uniqueInternalIdNamedNode, ns.shacl('maxCount'), this.factory.literal(attribute.upperBound));

      const parentUri = getTagValue(attribute, TagName.ParentUri, null);
      if (parentUri) {
        outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('subPropertyOf'), this.factory.namedNode(parentUri));
      }
    });
  }
}
