import type { OutputHandler } from '@oslo-flanders/core';
import type { EaAttribute, EaDocument } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getLanguageDependentTag, ignore } from '../utils/utils';

export class AttributeConverterHandler extends ConverterHandler {
  public documentNotification(document: EaDocument): void {
    const diagramAttributes = document.eaAttributes.filter(x => this.targetDiagram.elementIds.includes(x.classId));
    this.objects = diagramAttributes.filter(x => !ignore(x, false));
  }

  public convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const attributeUriMap = uriAssigner.attributeIdUriMap;
    const elementUriMap = uriAssigner.elementIdUriMap;

    this.objects.forEach(attribute => {
      const eaAttribute = <EaAttribute>attribute;

      const attributeUri = attributeUriMap.get(attribute.id);

      if (!attributeUri) {
        // Log errr
        return null;
      }

      // TODO: derived and scope not yet available
      const definition = getLanguageDependentTag(attribute, TagName.Definition);
      const label = getLanguageDependentTag(attribute, TagName.Label);
      const usageNote = getLanguageDependentTag(attribute, TagName.UsageNote);
      const domain = elementUriMap.get(attribute.classId)!;

      const osloAttribute = {
        uri: attributeUri,
        definition,
        label,
        usageNote,
        domain,
        minCardinality: attribute.lowerBound,
        maxCardinality: attribute.upperBound,
      };

      outputHandler.addAttribute(osloAttribute);
    });
  }
}
