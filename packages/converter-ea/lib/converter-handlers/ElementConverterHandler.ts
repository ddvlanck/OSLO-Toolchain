import { OutputHandler, Property, PropertyType, Scope } from '@oslo-flanders/core';
import type { Class } from '@oslo-flanders/core/lib/oslo/Class';
import type { DataType } from '@oslo-flanders/core/lib/oslo/DataType';
import type { EaConnector, EaDiagram, EaDocument, EaElement } from '@oslo-flanders/ea-extractor';
import { ElementType, ConnectorType } from '@oslo-flanders/ea-extractor';

import { ConverterHandler } from '../types/ConverterHandler';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue, ignore } from '../utils/utils';

export class ElementConverterHandler extends ConverterHandler {
  public generalizationConnectors: EaConnector[];

  public constructor(targetDiagram: EaDiagram, specificationType: string) {
    super(targetDiagram, specificationType);
    this.generalizationConnectors = [];
  }

  public documentNotification(document: EaDocument): void {
    this.objects = document.eaElements.filter(x => !ignore(x, false));
    this.generalizationConnectors = document.eaConnectors.filter(x => x.type === ConnectorType.Generalization);
  }

  // All elements will be processed and receive a URI, but only elements on the target diagram
  // will be passed to the OutputHandler. This flow is necessary because element types could be
  // in other packages and their URIs are needed to refer to in the output file.If filtering
  // would be applied in documentNotification, external types would not have an URI.
  public convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const elementUriMap = uriAssigner.elementIdUriMap;
    const packageUri = uriAssigner.packageIdUriMap.get(this.targetDiagram.packageId)!;
    const diagramElements = this.objects.filter(x => this.targetDiagram.elementIds.includes(x.id));

    diagramElements.forEach(element => {
      const eaElement = <EaElement>element;

      switch (eaElement.type) {
        case ElementType.Class: {
          const osloClass = this.convertToOsloClass(eaElement, elementUriMap, packageUri)!;
          outputHandler.addClass(osloClass);
          break;
        }

        case ElementType.DataType: {
          const osloDatatype = this.convertToOsloDataType(eaElement, elementUriMap, packageUri)!;
          outputHandler.addDataType(osloDatatype);
          break;
        }

        case ElementType.Enumeration: {
          const osloEnumeration = this.convertToOsloEnumeration(eaElement, elementUriMap, packageUri)!;
          outputHandler.addClass(osloEnumeration);
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
    packageUri: string,
  ): DataType | null {
    const dataTypeUri = elementUriMap.get(dataType.id);

    if (!dataTypeUri) {
      // Log error
      return null;
    }

    const definition = this.getDefinition(dataType);
    const label = this.getLabel(dataType);
    const usageNote = this.getUsageNote(dataType);
    const scope = this.getScope(dataType, packageUri, elementUriMap);

    return {
      uri: new URL(dataTypeUri),
      definition,
      label,
      usageNote,
      scope,
    };
  }

  private convertToOsloEnumeration(
    enumeration: EaElement,
    elementUriMap: Map<number, string>,
    packageUri: string,
  ): Class | null {
    const enumerationUri = elementUriMap.get(enumeration.id);
    if (!enumerationUri) {
      return null;
    }

    const definition = this.getDefinition(enumeration);
    // FIXME: this should be available through a tag
    const label = new Map<string, string>([['nl', enumeration.name]]);
    const usageNote = this.getUsageNote(enumeration);
    const scope = Scope.External;
    const codelist = getTagValue(enumeration, TagName.ApCodelist, null);

    const osloEnumeration: Class = {
      uri: new URL(enumerationUri),
      definition,
      label,
      usageNote,
      scope,
      ...codelist && { codelist: new URL(codelist) },
    };

    return osloEnumeration;
  }

  private convertToOsloClass(
    _class: EaElement,
    elementUriMap: Map<number, string>,
    packageUri: string,
  ): Class | null {
    const classUri = elementUriMap.get(_class.id);

    if (!classUri) {
      // Log error
      return null;
    }

    const definition = this.getDefinition(_class);
    const label = this.getLabel(_class);
    const usageNote = this.getUsageNote(_class);
    const scope = this.getScope(_class, packageUri, elementUriMap);

    const parentClass = this.generalizationConnectors.find(x => x.sourceObjectId === _class.id);
    let parentUri;

    if (parentClass) {
      parentUri = elementUriMap.get(parentClass.destinationObjectId);

      if (!parentUri) {
        // Log error
      }
    }

    const osloClass = {
      uri: new URL(classUri),
      definition,
      label,
      usageNote,
      scope,
      parent: parentUri,
    };

    return osloClass;
  }
}
