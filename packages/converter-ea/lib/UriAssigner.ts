import { getLoggerFor } from '@oslo-flanders/core';
import type { EaAttribute, EaDiagram, EaElement, EaPackage } from '@oslo-flanders/ea-extractor';
import { ConnectorType, ElementType } from '@oslo-flanders/ea-extractor';
import type { AttributeConverterHandler } from './converter-handlers/AttributeConverterHandler';
import type { ConnectorConverterHandler } from './converter-handlers/ConnectorConverterHandler';
import type { ElementConverterHandler } from './converter-handlers/ElementConverterHandler';
import type { PackageConverterHandler } from './converter-handlers/PackageConverterHandler';
import type { NormalizedConnector } from './types/NormalizedConnector';

import { TagName } from './types/TagName';
import { convertToCase, extractUri, getTagValue } from './utils/utils';

const backupBaseUri = 'https://fixme.com#';

export class UriAssigner {
  public readonly logger = getLoggerFor(this);
  // Package id mapped to a URI
  public readonly packageIdUriMap: Map<number, string>;

  // Package id mapped to ontology URI
  public readonly packageIdOntologyUriMap: Map<number, string>;

  // Element id mapped to a URI
  public readonly elementIdUriMap: Map<number, string>;

  // Attribute id mapped to a URI
  public readonly attributeIdUriMap: Map<number, string>;

  // Package name mapped to package object
  public readonly packageNameToPackageMap: Map<string, EaPackage[]>;

  // Element name mapped to element object
  public readonly elementNameToElementMap: Map<string, EaElement[]>;

  // Connector id mapped to a URI
  public readonly connectorIdUriMap: Map<number, string>;

  public constructor() {
    this.packageIdUriMap = new Map();
    this.packageIdOntologyUriMap = new Map();
    this.elementIdUriMap = new Map();
    this.attributeIdUriMap = new Map();
    this.packageNameToPackageMap = new Map();
    this.elementNameToElementMap = new Map();
    this.connectorIdUriMap = new Map();
  }

  public assignUris(
    diagram: EaDiagram,
    packageHandler: PackageConverterHandler,
    elementHandler: ElementConverterHandler,
    attributeHandler: AttributeConverterHandler,
    connectorConverterHandler: ConnectorConverterHandler,
  ): void {
    packageHandler.objects.forEach(_package =>
      this.packageNameToPackageMap
        .set(_package.name, [...this.packageNameToPackageMap.get(_package.name) || [], _package]));

    const elements = elementHandler.objects;

    this.assignUrisToPackages(<EaPackage[]>packageHandler.objects);
    this.assignUrisToElements(elements);
    this.assignUrisToAttributes(<EaAttribute[]>attributeHandler.objects, elements);
    this.assignConnectorUris(diagram, <NormalizedConnector[]>connectorConverterHandler.objects, elements);
  }

  public assignUrisToPackages(packages: EaPackage[]): void {
    packages.forEach(_package => {
      const packageUri = getTagValue(_package, TagName.PackageBaseUri, backupBaseUri, true);
      const namespace = packageUri.slice(0, -1);
      const ontologyURI = getTagValue(_package, TagName.PackageOntologyUri, namespace, true);

      this.packageIdUriMap.set(_package.packageId, packageUri);
      this.packageIdOntologyUriMap.set(_package.packageId, ontologyURI);
    });
  }

  public assignUrisToElements(elements: EaElement[]): void {
    elements.forEach(element => {
      const packageUri = this.packageIdUriMap.get(element.packageId);

      if (!packageUri) {
        this.logger.error(`Unnable to find the package URI for element (${element.path()}) with package id: ${element.packageId}.`);
        this.logger.info(`Element "${element.path()}" will be skipped.`);
        return;
      }

      const packageNameTag = getTagValue(element, TagName.DefiningPackage, null);
      let elementPackageUri = packageUri;

      if (packageNameTag) {
        elementPackageUri = this.getDefininingPackageUri(packageNameTag, elementPackageUri);
      }

      const extractedUri = extractUri(element, elementPackageUri, false);
      this.elementIdUriMap.set(element.id, extractedUri);
    });
  }

  public assignUrisToAttributes(attributes: EaAttribute[], elements: EaElement[]): void {
    attributes.forEach(attribute => {
      const attributeClass = elements.find(x => x.id === attribute.classId);

      if (!attributeClass) {
        this.logger.error(`Unnable to find the class (id=${attribute.classId}) to which the attribute (${attribute.path()}) belongs.`);
        this.logger.info(`Attribute "${attribute.path()}" will be skipped.`);
        return;
      }

      const packageUri = this.packageIdUriMap.get(attributeClass.packageId);

      if (!packageUri) {
        this.logger.error(`Unnable to find the package URI for attribute (${attribute.path()}) with package id: ${attributeClass.packageId}.`);
        this.logger.info(`Attribute "${attribute.path()}" will be skipped.`);
        return;
      }

      const packageNameTag = getTagValue(attribute, TagName.DefiningPackage, null);
      let attributePackageUri = packageUri;

      if (packageNameTag) {
        attributePackageUri = this.getDefininingPackageUri(packageNameTag, attributePackageUri);
      }

      if (attributeClass.type === ElementType.Enumeration) {
        let namespace = attributePackageUri;

        if (namespace.endsWith('/') || namespace.endsWith('#')) {
          namespace = namespace.slice(0, Math.max(0, namespace.length - 1));
        }

        let localName = getTagValue(attributeClass, TagName.LocalName, attributeClass.name);
        localName = convertToCase(localName, true, attribute.id);

        const instanceNamespace = `${namespace}/${localName}/`;
        const attributeUri = extractUri(attribute, instanceNamespace, true);
        this.attributeIdUriMap.set(attribute.id, attributeUri);
      } else {
        const uri = extractUri(attribute, attributePackageUri, true);
        this.attributeIdUriMap.set(attribute.id, uri);
      }
    });
  }

  public assignConnectorUris(diagram: EaDiagram, connectors: NormalizedConnector[], elements: EaElement[]): void {
    const diagramConnectors: NormalizedConnector[] = [];

    diagram.connectorsIds.forEach(connectorId => {
      const filteredConnectors = connectors.filter(x => x.innerConnectorId === connectorId) || [];
      diagramConnectors.push(...filteredConnectors);
    });

    diagramConnectors.forEach(connector => {
      // Inheritance related connectors do not get an URI.
      if (connector.innerConnectorType === ConnectorType.Generalization) {
        return;
      }

      let connectorUri = getTagValue(connector, TagName.Externaluri, null);
      const packageName = getTagValue(connector, TagName.DefiningPackage, null);
      const connectorPackages = this.packageNameToPackageMap.get(packageName);
      let definingPackageUri: string | null = null;

      // Here, we check the value of the 'package' tag.
      // If there was no value, both source and destination must be defined in the same package.
      // If there was a value, we check that the same package name is used for different packages,
      // (otherwise we log a warning)
      if (!connectorPackages || connectorPackages.length === 0) {
        const sourcePackageId = elements.find(x => x.id === connector.sourceObjectId)!.packageId;
        const destinationPackageId = elements.find(x => x.id === connector.destinationObjectId)!.packageId;

        if (sourcePackageId === destinationPackageId) {
          this.logger.info(`Assuming connector (${connector.path()}) belongs to package (${sourcePackageId}) based on source and target definition.`);
          definingPackageUri = this.packageIdUriMap.get(sourcePackageId)!;
        }
      } else {
        if (connectorPackages.length > 1) {
          this.logger.warn(`Ambiguous package "${packageName}" name specified for connector (${connector.path()}).`);
        }
        definingPackageUri = this.packageIdUriMap.get(connectorPackages[0].packageId)!;
      }

      // If there is no value for the 'uri' tag
      if (!connectorUri) {
        // Then the connector must have a value for the 'package' tag
        if (!definingPackageUri) {
          this.logger.warn(`Ignoring connector (${connector.path()}) as it lacks a defining package or is defined on a non-existing package.`);
          return;
        }

        let localName = getTagValue(connector, TagName.LocalName, connector.name);
        if (!localName) {
          this.logger.warn(`Connector (${connector.path()}) does not have a name and will be ignored.`);
          return;
        }

        localName = convertToCase(localName, true, connector.id);
        connectorUri = definingPackageUri + localName;
      }

      // This.logger.info(`Connector (${connector.path()}) was assigned the following URI: '${connectorUri}'.`);
      this.connectorIdUriMap.set(connector.id, connectorUri);
    });
  }

  private getDefininingPackageUri(packageName: string, currentPackageUri: string): string {
    const referencedPackages = this.packageNameToPackageMap.get(packageName) || [];

    if (referencedPackages.length === 0) {
      this.logger.warn(`Specified package '${packageName}' was not found.`);
      return currentPackageUri;
    }

    if (referencedPackages.length > 1) {
      this.logger.warn(`Ambiguous package name "${packageName}" found.`);
    }

    return this.packageIdUriMap.get(referencedPackages[0].packageId)!;
  }
}
