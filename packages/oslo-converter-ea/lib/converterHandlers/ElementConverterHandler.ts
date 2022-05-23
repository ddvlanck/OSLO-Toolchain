import type { OutputHandler } from '@oslo-flanders/core';
import { ns, Scope } from '@oslo-flanders/core';

import { EaElement } from '@oslo-flanders/ea-extractor';
import { ElementType } from '@oslo-flanders/ea-extractor';

import { ConverterHandler } from '../types/ConverterHandler';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';

export class ElementConverterHandler extends ConverterHandler<EaElement> {
  // All elements will be processed and receive a URI, but only elements on the target diagram
  // will be passed to the OutputHandler. This flow is necessary because element types could be
  // in other packages and their URIs are needed to refer to in the output file.If filtering
  // would be applied in documentNotification, external types would not have an URI.
  public addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const targetDiagram = this.converter.getTargetDiagram();
    const elementUriMap = uriAssigner.elementIdUriMap;
    const packageUri = uriAssigner.packageIdUriMap.get(targetDiagram.packageId)!;
    const diagramElements = this.converter.getElements().filter(x => targetDiagram.elementIds.includes(x.id));

    diagramElements.forEach(element => {
      const eaElement = element;

      switch (eaElement.type) {
        case ElementType.Class: {
          return this.convertToOsloClass(outputHandler, eaElement, elementUriMap, packageUri);
        }

        case ElementType.DataType: {
          return this.convertToOsloDataType(outputHandler, eaElement, elementUriMap, packageUri);
        }

        case ElementType.Enumeration: {
          return this.convertToOsloEnumeration(outputHandler, eaElement, elementUriMap);
        }

        default:
          throw new Error(`Element type not supported`);
      }
    });
  }

  private convertToOsloDataType(
    outputHandler: OutputHandler,
    dataType: EaElement,
    elementUriMap: Map<number, string>,
    packageUri: string,
  ): void {
    const dataTypeUri = elementUriMap.get(dataType.id);

    if (!dataTypeUri) {
      // TODO: Log error
      return;
    }

    const dataTypeUriNamedNode = this.factory.namedNode(dataTypeUri);
    outputHandler.add(dataTypeUriNamedNode, ns.rdf('type'), ns.example('DataType'));

    const definition = this.getDefinition(dataType);
    outputHandler.add(dataTypeUriNamedNode, ns.rdfs('comment'), definition);

    const label = this.getLabel(dataType);
    outputHandler.add(dataTypeUriNamedNode, ns.rdfs('label'), label);

    const usageNote = this.getUsageNote(dataType);
    outputHandler.add(dataTypeUriNamedNode, ns.vann('usageNote'), usageNote);

    const scope = this.getScope(dataType, packageUri, elementUriMap);
    // TODO: remove example.org
    const scopeLiteral = this.factory.literal(scope);
    outputHandler.add(dataTypeUriNamedNode, ns.example('scope'), scopeLiteral);
  }

  private convertToOsloEnumeration(
    outputHandler: OutputHandler,
    enumeration: EaElement,
    elementUriMap: Map<number, string>,
  ): void {
    /**
     * Since an enumeration is a codelist, and adding its
     * information to an N3.Store, we do not longer know
     * which label, definition and usage note belong together.
     * For that reason, we set a temporary graph for each enumeration
     * object, based on its id.
     * This graph will then be updated in the AttributeConverterHandler
     */
    const enumerationUri = elementUriMap.get(enumeration.id);
    const tempGraph = ns.example(enumeration.guid);

    if (!enumerationUri) {
      // TODO: log error
      return;
    }

    const enumerationUriNamedNode = this.factory.namedNode(enumerationUri);
    outputHandler.add(enumerationUriNamedNode, ns.rdf('type'), ns.owl('Class'), tempGraph);

    const definition = this.getDefinition(enumeration);
    outputHandler.add(enumerationUriNamedNode, ns.rdfs('comment'), definition, tempGraph);

    // FIXME: this should be available through a tag (language-aware)
    const label = this.factory.literal(enumeration.name);
    outputHandler.add(enumerationUriNamedNode, ns.rdfs('label'), label, tempGraph);

    const usageNote = this.getUsageNote(enumeration);
    outputHandler.add(enumerationUriNamedNode, ns.vann('usageNote'), usageNote, tempGraph);

    const scope = Scope.External;
    // TODO: remove example.org
    const scopeLiteral = this.factory.literal(scope);
    outputHandler.add(enumerationUriNamedNode, ns.example('scope'), scopeLiteral, tempGraph);

    const codelist = getTagValue(enumeration, TagName.ApCodelist, null);
    // TODO: check what the value of this tag can be - now expecting an IRI
    if (codelist) {
      outputHandler.add(enumerationUriNamedNode, ns.example('codelist'), this.factory.namedNode(codelist), tempGraph);
    }
  }

  private convertToOsloClass(
    outputHandler: OutputHandler,
    _class: EaElement,
    elementUriMap: Map<number, string>,
    packageUri: string,
  ): void {
    const classUri = elementUriMap.get(_class.id);

    if (!classUri) {
      // Log error
      return;
    }

    const classUriNamedNode = this.factory.namedNode(classUri);
    outputHandler.add(classUriNamedNode, ns.rdf('type'), ns.owl('Class'));

    const definition = this.getDefinition(_class);
    outputHandler.add(classUriNamedNode, ns.rdfs('comment'), definition);

    const label = this.getLabel(_class);
    outputHandler.add(classUriNamedNode, ns.rdfs('label'), label);

    const usageNote = this.getUsageNote(_class);
    outputHandler.add(classUriNamedNode, ns.vann('usageNote'), usageNote);

    const scope = this.getScope(_class, packageUri, elementUriMap);
    // TODO: remove example.org
    const scopeLiteral = this.factory.literal(scope);
    outputHandler.add(classUriNamedNode, ns.example('scope'), scopeLiteral);

    const parentClass = this.converter.getGeneralizationConnectors().find(x => x.sourceObjectId === _class.id);
    let parentUri;

    if (parentClass) {
      parentUri = elementUriMap.get(parentClass.destinationObjectId);

      if (!parentUri) {
        // TODO: Log error
        return;
      }

      outputHandler.add(classUriNamedNode, ns.rdfs('subClassOf'), this.factory.namedNode(parentUri));
    }
  }
}
