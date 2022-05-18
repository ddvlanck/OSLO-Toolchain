import type { OutputHandler, Property } from '@oslo-flanders/core';
import { PropertyType } from '@oslo-flanders/core';
import type { EaAttribute } from '@oslo-flanders/ea-extractor';
import type { EaConverter } from '../EaConverter';
import { ConverterHandler } from '../types/ConverterHandler';
import { DataTypes } from '../types/DataTypes';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';

export class AttributeConverterHandler extends ConverterHandler<EaAttribute> {
  public constructor(converter: EaConverter) {
    super(converter);
  }

  public createOsloObject(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const attributeUriMap = uriAssigner.attributeIdUriMap;
    const elementUriMap = uriAssigner.elementIdUriMap;
    const elementNameToElementMap = uriAssigner.elementNameToElementMap;
    const packageUri = uriAssigner.packageIdUriMap.get(this.converter.getTargetDiagram().packageId)!;

    this.converter.getAttributes().forEach(attribute => {
      const eaAttribute = attribute;

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
      const domainLabel = this.converter.getElements().find(x => x.id === eaAttribute.classId)!.name;
      const scope = this.getScope(eaAttribute, packageUri, attributeUriMap);

      const osloAttribute: Property = {
        uri: new URL(attributeUri),
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
