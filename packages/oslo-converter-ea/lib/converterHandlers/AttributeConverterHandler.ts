import type { OutputHandler } from '@oslo-flanders/core';
import { ns, PropertyType } from '@oslo-flanders/core';

import type { EaAttribute } from '@oslo-flanders/ea-extractor';
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

      // Publish a unique reference of this attribute
      const uniqueInternalIdNamedNode = ns.example(`.well-known/${attribute.internalGuid}`);
      outputHandler.add(uniqueInternalIdNamedNode, ns.example('guid'), attributeUriNamedNode);

      let range = getTagValue(attribute, TagName.Range, null);
      let attributeType: PropertyType;
      let rangeLabel: string | undefined;

      // TODO: range should have a label, but how does is work when range is added through a tag?
      // TODO: rangeLabels should be added to store as well.

      // FIXME: re-write this part
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
        // Range will be set to the .well-known URI
        // FIXME: problem here is that elementUriMap contains the correct URI
        // but the element is not on the diagram, meaning it is not added to the
        // N3.Store
        // Possible solution is to check if the element is on the diagram
        // And if not, then add id, because we reference it
        if (!this.converter.getTargetDiagram().elementIds.includes(element.id)) {
          this.converter.addElementToOutput(element);
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

      // FIXME: what if range is not yet added by the ElementConverterHandler?

      // When adding a range, the graph is set to the attribute URI
      // This is necessary for codelists, because they share the same URI
      // (http://www.w3.org/2004/02/skos/core#Concept)
      // Otherwise, it is impossible to extract the correct label, definition and usage note
      // attached to the skos:Concept URI for this attribute
      // if (rangeNamedNode.equals(ns.skos('Concept'))) {
      //   outputHandler.updateGraph(rangeNamedNode, this.factory.literal(rangeLabel), attributeUriNamedNode);
      // }

      const definition = this.getDefinition(attribute);
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('comment'), definition);

      const label = this.getLabel(attribute);
      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('label'), label);

      const usageNote = this.getUsageNote(attribute);
      outputHandler.add(uniqueInternalIdNamedNode, ns.vann('usageNote'), usageNote);

      // Const domain = elementUriMap.get(attribute.classId)!;
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
