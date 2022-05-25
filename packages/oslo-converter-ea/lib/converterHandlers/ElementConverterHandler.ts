import type { OutputHandler } from '@oslo-flanders/core';
import { ns, Scope } from '@oslo-flanders/core';

import { ElementType } from '@oslo-flanders/ea-extractor';
import type { EaElement, EaDiagram } from '@oslo-flanders/ea-extractor';

import type * as RDF from '@rdfjs/types';
import { ConverterHandler } from '../types/ConverterHandler';
import { TagName } from '../types/TagName';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';

// See comment in attribute handler about strategy

export class ElementConverterHandler extends ConverterHandler<EaElement> {
  // All elements will be processed and receive a URI, but only elements on the target diagram
  // will be passed to the OutputHandler. This flow is necessary because element types could be
  // in other packages and their URIs are needed to refer to in the output file.If filtering
  // would be applied in documentNotification, external types would not have an URI.
  public async addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): Promise<void> {
    const targetDiagram = this.converter.getTargetDiagram();
    const diagramElements = this.converter.getElements().filter(x => targetDiagram.elementIds.includes(x.id));

    diagramElements.forEach(element => {
      this.addObjectToOutput(element, targetDiagram, uriAssigner, outputHandler);
    });
  }

  public addObjectToOutput(
    element: EaElement,
    targetDiagram: EaDiagram,
    uriAssigner: UriAssigner,
    outputHandler: OutputHandler,
  ): void {
    const elementUriMap = uriAssigner.elementIdUriMap;
    const packageUri = uriAssigner.packageIdUriMap.get(targetDiagram.packageId)!;

    switch (element.type) {
      case ElementType.Class: {
        return this.convertToOsloClass(outputHandler, element, elementUriMap, packageUri);
      }

      case ElementType.DataType: {
        return this.convertToOsloDataType(outputHandler, element, elementUriMap, packageUri);
      }

      case ElementType.Enumeration: {
        return this.convertToOsloEnumeration(outputHandler, element, elementUriMap);
      }

      default:
        throw new Error(`Element type not supported`);
    }
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

    // Publish a unique reference of this data type
    const uniqueInternalIdNamedNode = ns.example(`.well-known/${dataType.internalGuid}`);
    outputHandler.add(uniqueInternalIdNamedNode, ns.example('guid'), dataTypeUriNamedNode);

    outputHandler.add(uniqueInternalIdNamedNode, ns.rdf('type'), ns.example('DataType'));

    const definition = this.getDefinition(dataType);
    outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('comment'), definition);

    const label = this.getLabel(dataType);
    outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('label'), label);

    const usageNote = this.getUsageNote(dataType);
    outputHandler.add(uniqueInternalIdNamedNode, ns.vann('usageNote'), usageNote);

    const scope = this.getScope(dataType, packageUri, elementUriMap);
    // TODO: remove example.org
    const scopeLiteral = this.factory.literal(scope);
    outputHandler.add(uniqueInternalIdNamedNode, ns.example('scope'), scopeLiteral);
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

    if (!enumerationUri) {
      // TODO: log error
      return;
    }

    const enumerationUriNamedNode = this.factory.namedNode(enumerationUri);

    // Publish a unique reference of this enumeration
    const uniqueInternalIdNamedNode = ns.example(`.well-known/${enumeration.internalGuid}`);
    outputHandler.add(uniqueInternalIdNamedNode, ns.example('guid'), enumerationUriNamedNode);

    outputHandler.add(uniqueInternalIdNamedNode, ns.rdf('type'), ns.owl('Class'));

    const definition = this.getDefinition(enumeration);
    outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('comment'), definition);

    // FIXME: this should be available through a tag (language-aware)
    const label = this.factory.literal(enumeration.name);
    outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('label'), label);

    const usageNote = this.getUsageNote(enumeration);
    outputHandler.add(uniqueInternalIdNamedNode, ns.vann('usageNote'), usageNote);

    const scope = Scope.External;
    // TODO: remove example.org
    const scopeLiteral = this.factory.literal(scope);
    outputHandler.add(uniqueInternalIdNamedNode, ns.example('scope'), scopeLiteral);

    const codelist = getTagValue(enumeration, TagName.ApCodelist, null);
    // TODO: check what the value of this tag can be - now expecting an IRI
    if (codelist) {
      outputHandler.add(uniqueInternalIdNamedNode, ns.example('codelist'), this.factory.namedNode(codelist));
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

    // Publish a unique reference of this attribute
    const uniqueInternalIdNamedNode = ns.example(`.well-known/${_class.internalGuid}`);
    outputHandler.add(uniqueInternalIdNamedNode, ns.example('guid'), classUriNamedNode);

    outputHandler.add(uniqueInternalIdNamedNode, ns.rdf('type'), ns.owl('Class'));

    const definition = this.getDefinition(_class);
    outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('comment'), definition);

    const label = this.getLabel(_class);
    outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('label'), label);

    const usageNote = this.getUsageNote(_class);
    outputHandler.add(uniqueInternalIdNamedNode, ns.vann('usageNote'), usageNote);

    const scope = this.getScope(_class, packageUri, elementUriMap);
    // TODO: remove example.org
    const scopeLiteral = this.factory.literal(scope);
    outputHandler.add(uniqueInternalIdNamedNode, ns.example('scope'), scopeLiteral);

    const parentClasses = this.converter.getGeneralizationConnectors().filter(x => x.sourceObjectId === _class.id);

    // FIXME: use well known id for this
    if (parentClasses.length > 0) {
      const parentUris = parentClasses.reduce<RDF.NamedNode[]>((uris, parentClass) => {
        const parentUri = elementUriMap.get(parentClass.destinationObjectId);

        if (!parentUri) {
          // TODO: log error
        } else {
          uris.push(this.factory.namedNode(parentUri));
        }

        return uris;
      }, []);

      outputHandler.add(uniqueInternalIdNamedNode, ns.rdfs('subClassOf'), parentUris);
    }
  }
}
