import type { OutputHandler } from '@oslo-flanders/core';
import type { Class } from '@oslo-flanders/core/lib/oslo/Class';
import type { DataType } from '@oslo-flanders/core/lib/oslo/DataType';
import type { EaConnector, EaDocument, EaElement } from '@oslo-flanders/ea-extractor';
import { ElementType, ConnectorType } from '@oslo-flanders/ea-extractor';

import { ConverterHandler } from '../types/ConverterHandler';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue, ignore } from '../utils/utils';

export class ElementConverterHandler extends ConverterHandler {
  public generalizationConnectors: EaConnector[];

  public constructor() {
    super();
    this.generalizationConnectors = [];
  }

  public documentNotification(document: EaDocument): void {
    this.objects = document.eaElements.filter(x => !ignore(x, false));
    this.generalizationConnectors = document.eaConnectors.filter(x => x.type === ConnectorType.Generalization);
  }

  public convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const elementUriMap = uriAssigner.elementIdUriMap;

    // TODO: process other elements as well
    this.objects.forEach(element => {
      const eaElement = <EaElement>element;

      switch (eaElement.type) {
        case ElementType.Class: {
          const osloClass = this.convertToOsloClass(eaElement, elementUriMap)!;
          outputHandler.addClass(osloClass);
          break;
        }

        default:
          throw new Error(`Other types will be implemented soon`);
      }
    });
  }

  private convertToOsloClass(
    _class: EaElement,
    elementUriMap: Map<number, string>,
  ): Class | null {
    const classUri = elementUriMap.get(_class.id);

    if (!classUri) {
      // Log error
      return null;
    }

    const definition = getTagValue(_class, TagName.Definition, '');
    const label = getTagValue(_class, TagName.LabelNl, '');
    const usageNote = getTagValue(_class, TagName.UsageNote, '');

    const parentClass = this.generalizationConnectors.find(x => x.sourceObjectId === _class.id);
    let parentUri;

    if (parentClass) {
      parentUri = elementUriMap.get(parentClass.destinationObjectId);

      if (!parentUri) {
        // Log error
      }
    }

    // TODO: scope not yet available
    const osloClass = {
      uri: classUri,
      definition,
      label,
      usageNote,
      parent: parentUri,
    };

    return osloClass;
  }

  private convertToOsloDataType(
    dataType: EaElement,
    elementUriMap: Map<number, string>,
  ): DataType | null {
    const dataTypeUri = elementUriMap.get(dataType.id);

    if (!dataTypeUri) {
      // Log error
      return null;
    }

    const definition = getTagValue(dataType, TagName.Definition, '');
    const label = getTagValue(dataType, TagName.LabelNl, '');
    const usageNote = getTagValue(dataType, TagName.UsageNote, '');

    return {
      uri: dataTypeUri,
      definition,
      label,
      usageNote,
    };
  }
}
