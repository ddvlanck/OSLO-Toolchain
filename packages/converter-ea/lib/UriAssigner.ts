import { getLoggerFor } from '@oslo-flanders/core';
import type { EaAttribute, EaDiagram, EaElement, EaPackage } from '@oslo-flanders/ea-extractor';
import { ConnectorType, ElementType } from '@oslo-flanders/ea-extractor';
import type { NormalizedConnector } from './types/connectors/NormalizedConnector';

import { TagName } from './types/TagName';
import { convertToCase, extractUri, getTagValue } from './utils/utils';

const backupBaseUri = 'https://fixme.com#';

export class UriAssigner {
  private readonly logger = getLoggerFor(this);
  // Package id mapped to a URI
  private readonly packageIdUriMap: Map<number, string>;

  // Package id mapped to ontology URI
  private readonly packageIdOntologyUriMap: Map<number, string>;

  // Element id mapped to a URI
  private readonly elementIdUriMap: Map<number, string>;

  // Attribute id mapped to a URI
  private readonly attributeIdUriMap: Map<number, string>;

  // Package name mapped to package object
  private readonly packageNameToPackageMap: Map<string, EaPackage[]>;

  // Element name mapped to element object
  private readonly elementNameToElementMap: Map<string, EaElement[]>;

  // Connector id mapped to a URI
  // FIXME, cant use id because multiple connectors can share the same id
  private readonly connectorIdUriMap: Map<string, string>;

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
    packages: EaPackage[],
    elements: EaElement[],
    attributes: EaAttribute[],
    connectors: NormalizedConnector[],
  ): void {
    packages.forEach(_package =>
      this.packageNameToPackageMap
        .set(_package.name, [...this.packageNameToPackageMap.get(_package.name) || [], _package]));

    this.assignUrisToPackages(packages);
    this.assignUrisToElements(elements);
    this.assignUrisToAttributes(attributes, elements);
    this.assignConnectorUris(diagram, connectors, elements);
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
        this.logger.error(`No package URI found for element (${element.guid})`);
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
      // TODO: log errors if not found
      const _class = elements.find(x => x.id === attribute.classId)!;
      const packageUri = this.packageIdUriMap.get(_class.packageId)!;
      const packageNameTag = getTagValue(attribute, TagName.DefiningPackage, null);
      let attributePackageUri = packageUri;

      if (packageNameTag) {
        attributePackageUri = this.getDefininingPackageUri(packageNameTag, attributePackageUri);
      }

      if (_class.type === ElementType.Enumeration) {
        let namespace = attributePackageUri;

        if (namespace.endsWith('/') || namespace.endsWith('#')) {
          namespace = namespace.slice(0, Math.max(0, namespace.length - 1));
        }

        let localName = getTagValue(_class, TagName.LocalName, _class.name);
        localName = convertToCase(localName, true, attribute.id);

        const instanceNamespace = `${namespace}/${localName}/`;
        const attributeUri = extractUri(attribute, instanceNamespace, true);
        this.attributeIdUriMap.set(attribute.id, attributeUri);
      } else {
        const uri = extractUri(attribute, attributePackageUri, true);

        // TODO: check original because this differs (is put in other map) (L 253)
        this.attributeIdUriMap.set(attribute.id, uri);
      }
    });
  }

  public assignConnectorUris(diagram: EaDiagram, connectors: NormalizedConnector[], elements: EaElement[]): void {
    const diagramConnectors: NormalizedConnector[] = [];

    diagram.connectorsIds.forEach(connectorId => {
      const filteredConnectors = connectors.filter(x => x.innerConnectorId === connectorId)!;
      diagramConnectors.push(...filteredConnectors);
    });

    diagramConnectors.forEach(connector => {
      if (connector.innerConnectorType === ConnectorType.Generalization) {
        return;
      }

      let connectorUri = getTagValue(connector, TagName.Externaluri, null);
      const packageName = getTagValue(connector, TagName.DefiningPackage, null);
      const connectorPackages = this.packageNameToPackageMap.get(packageName);
      let definingPackageUri: string | null = null;

      // Here, we check the value of the 'package' tag.
      // If there was no value, both source and destination should be defined in the same package.
      // If there was a value, we check that the same package name is used for different packages 
      // (otherwise we log a warning)
      if (!connectorPackages) {
        const sourcePackageId = elements.find(x => x.id === connector.sourceObjectId)!.packageId;
        const destinationPackageId = elements.find(x => x.id === connector.destinationObjectId)!.packageId;

        if (sourcePackageId === destinationPackageId) {
          //this.logger.info(`Assuming connector (${connector.id}) belongs to package (${sourcePackageId}) based on source and target definition.`);
          definingPackageUri = this.packageIdUriMap.get(sourcePackageId)!;
        }
      } else if (connectorPackages.length >= 2) {
        //this.logger.warn(`Ambiguous package name specified for connector (${connector.id})`);
        definingPackageUri = this.packageIdUriMap.get(connectorPackages[0].packageId)!;
      } else if (connectorPackages.length === 1) {
        definingPackageUri = this.packageIdUriMap.get(connectorPackages[0].packageId)!;
      }

      // If there is no value for the 'uri' tag
      if (!connectorUri) {
        // Then the connector must have a value for the 'package' tag
        if (!definingPackageUri) {
          //this.logger.warn(`Ignoring connector (${connector.id}) as it lacks a defining package or is defined on a non-existing package.`);
          return;
        }

        let localName = getTagValue(connector, TagName.LocalName, connector.innerConnectorName);
        if (!localName) {
          //this.logger.warn(`Connector (${connector.id}) does not have a name and will be ignored.`);
          return;
        }

        localName = convertToCase(localName, true, connector.id);
        connectorUri = definingPackageUri + localName;
      }

      //this.logger.debug(`Connector (${connector.id}) was assigned the following URI: '${connectorUri}'.`);
      this.connectorIdUriMap.set(connector.id, connectorUri);
    });
  }

  private getDefininingPackageUri(packageName: string, currentPackageUri: string): string {
    const referencedPackages = this.packageNameToPackageMap.get(packageName);

    if (referencedPackages?.length === 0) {
      // TODO: add element to log message
      this.logger.warn(`Specified package '${packageName}' was not found.`);
      return currentPackageUri;
    }

    if (referencedPackages?.length === 1) {
      return this.packageIdUriMap.get(referencedPackages[0].packageId)!;
    }

    this.logger.warn(`Ambiguous package name '${packageName}' was found`);
    return this.packageIdUriMap.get(referencedPackages![0].packageId)!;
  }
}
