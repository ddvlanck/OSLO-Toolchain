import type { OutputHandler } from '@oslo-flanders/core';
import type { EaAttribute, EaDocument } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import type { UriAssigner } from '../UriAssigner';
import { ignore } from '../utils/utils';

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
      const definition = this.getDefinition(attribute);
      const label = this.getLabel(attribute);
      const usageNote = this.getUsageNote(attribute);
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
