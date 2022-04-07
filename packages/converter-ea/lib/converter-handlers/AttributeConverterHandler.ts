import type { OutputHandler } from '@oslo-flanders/core';
import type { EaDocument } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue, ignore } from '../utils/utils';

export class AttributeConverterHandler extends ConverterHandler {
  public documentNotification(document: EaDocument): void {
    this.objects = document.eaAttributes.filter(x => !ignore(x, false));
  }

  public convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const attributeUriMap = uriAssigner.attributeIdUriMap;
    const elementUriMap = uriAssigner.elementIdUriMap;

    this.objects.forEach(attribute => {
      const attributeUri = attributeUriMap.get(attribute.id);

      if (!attributeUri) {
        // Log errr
        return null;
      }

      // TODO: derived and scope not yet available
      const definition = getTagValue(attribute, TagName.Definition, '');
      const label = getTagValue(attribute, TagName.LabelNl, '');
      const usageNote = getTagValue(attribute, TagName.UsageNote, '');
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
