import type { OutputHandler, Property } from '@oslo-flanders/core';
import { PropertyType } from '@oslo-flanders/core';
import type { EaAttribute, EaDiagram, EaDocument, EaElement } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import { DataTypes } from '../types/DataTypes';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue, ignore } from '../utils/utils';

export class AttributeConverterHandler extends ConverterHandler {
  private elements: EaElement[];

  public constructor(targetDiagram: EaDiagram, specificationType: string) {
    super(targetDiagram, specificationType);
    this.elements = [];
  }

  public documentNotification(document: EaDocument): void {
    const diagramAttributes = document.eaAttributes.filter(x => this.targetDiagram.elementIds.includes(x.classId));
    this.objects = diagramAttributes.filter(x => !ignore(x, false));
    this.elements = document.eaElements;
  }

  public convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const attributeUriMap = uriAssigner.attributeIdUriMap;
    const elementUriMap = uriAssigner.elementIdUriMap;
    const elementNameToElementMap = uriAssigner.elementNameToElementMap;
    const packageUri = uriAssigner.packageIdUriMap.get(this.targetDiagram.packageId)!;

    this.objects.forEach(attribute => {
      const eaAttribute = <EaAttribute>attribute;

      const attributeUri = attributeUriMap.get(attribute.id);

      if (!attributeUri) {
        // Log errr
        return null;
      }

      let range = getTagValue(eaAttribute, TagName.Range, null);
      let attributeType: PropertyType;
      let rangeLabel: string | undefined;

      // TODO: range should have a label, but how does is work when range is added through a tag?

      if (range) {
        const isLiteral = getTagValue(eaAttribute, TagName.IsLiteral, false);
        attributeType = isLiteral === 'true' ? PropertyType.DataTypeProperty : PropertyType.ObjectProperty;
      } else if (DataTypes.has(eaAttribute.type)) {
        attributeType = PropertyType.DataTypeProperty;
        range = DataTypes.get(eaAttribute.type)!;
        rangeLabel = eaAttribute.type;
      } else if (elementNameToElementMap.has(eaAttribute.type)) {
        const elements = elementNameToElementMap.get(eaAttribute.type)!;

        if (elements && elements.length > 1) {
          // Log warning
        }

        const element = elements[0];
        const elementIsLiteral = getTagValue(element, TagName.IsLiteral, false);

        attributeType = elementIsLiteral === 'true' ? PropertyType.DataTypeProperty : PropertyType.ObjectProperty;
        range = elementUriMap.get(element.id)!;
        rangeLabel = eaAttribute.type;
      } else {
        attributeType = PropertyType.Property;
      }

      // TODO: handle subproperties

      // TODO: derived not yet available
      const definition = this.getDefinition(eaAttribute);
      const label = this.getLabel(eaAttribute);
      const usageNote = this.getUsageNote(eaAttribute);
      const domain = elementUriMap.get(eaAttribute.classId)!;
      const domainLabel = this.elements.find(x => x.id === eaAttribute.classId)!.name;
      const scope = this.getScope(eaAttribute, packageUri, attributeUriMap);

      const osloAttribute: Property = {
        uri: attributeUri,
        definition,
        label,
        usageNote,
        domain,
        domainLabel,
        minCardinality: attribute.lowerBound,
        maxCardinality: attribute.upperBound,
        type: attributeType,
        range,
        rangeLabel,
        scope,
      };

      outputHandler.addAttribute(osloAttribute);
    });
  }
}
