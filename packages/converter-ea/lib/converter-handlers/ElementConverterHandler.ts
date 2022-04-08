import type { OutputHandler } from '@oslo-flanders/core';
import type { Class } from '@oslo-flanders/core/lib/oslo/Class';
import type { DataType } from '@oslo-flanders/core/lib/oslo/DataType';
import type { EaConnector, EaDiagram, EaDocument, EaElement } from '@oslo-flanders/ea-extractor';
import { ElementType, ConnectorType } from '@oslo-flanders/ea-extractor';

import { ConverterHandler } from '../types/ConverterHandler';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getLanguageDependentTag, ignore } from '../utils/utils';

export class ElementConverterHandler extends ConverterHandler {
  public generalizationConnectors: EaConnector[];

  public constructor(targetDiagram: EaDiagram) {
    super(targetDiagram);
    this.generalizationConnectors = [];
  }

  public documentNotification(document: EaDocument): void {
    const diagramElements = document.eaElements.filter(x => this.targetDiagram.elementIds.includes(x.id));
    this.objects = diagramElements.filter(x => !ignore(x, false));
    this.generalizationConnectors = document.eaConnectors.filter(x => x.type === ConnectorType.Generalization);
  }

  public convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const elementUriMap = uriAssigner.elementIdUriMap;

    this.objects.forEach(element => {
      const eaElement = <EaElement>element;

      switch (eaElement.type) {
        case ElementType.Class: {
          const osloClass = this.convertToOsloClass(eaElement, elementUriMap)!;
          outputHandler.addClass(osloClass);
          break;
        }

        case ElementType.DataType: {
          const osloDatatype = this.convertToOsloDataType(eaElement, elementUriMap)!;
          outputHandler.addDataType(osloDatatype);
          break;
        }

        case ElementType.Enumeration: {
          this.convertToOsloEnumeration(eaElement, elementUriMap);
          break;
        }

        default:
          console.log('Other types soon.');
      }
    });
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

    const definition = getLanguageDependentTag(dataType, TagName.Definition);
    const label = getLanguageDependentTag(dataType, TagName.Label);
    const usageNote = getLanguageDependentTag(dataType, TagName.UsageNote);

    return {
      uri: dataTypeUri,
      definition,
      label,
      usageNote,
    };
  }

  private convertToOsloEnumeration(
    enumeration: EaElement,
    elementUriMap: Map<number, string>,
  ): void {
    // TODO
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

    const definition = getLanguageDependentTag(_class, TagName.Definition);
    const label = getLanguageDependentTag(_class, TagName.Label);
    const usageNote = getLanguageDependentTag(_class, TagName.UsageNote);

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
}
