// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-unused-expressions */
import { getLoggerFor } from '@oslo-flanders/core';
import type { EaConnector, EaElement, EaObject, Tag } from '@oslo-flanders/ea-extractor';
import { ConnectorType } from '@oslo-flanders/ea-extractor';
import { NormalizedConnector, NormalizedConnectorType } from '../types/NormalizedConnector';
import { TagName } from '../types/TagName';

export function ignore(object: EaObject, _default: any): boolean {
  const ignoreObject = getTagValue(object, TagName.Ignore, false, true);
  return Boolean(ignoreObject);
}

// TODO: see getTagValues function
// TODO: fix any type for object
export function getTagValue(object: any, tagName: TagName, _default: any, silent = true): string {
  const logger = getLoggerFor('GetTagValueFunction');
  const tags = object.tags?.filter((x: Tag) => x.tagName === tagName);

  if (!tags || tags.length === 0) {
    silent || logger.warn(`Missing tag '${tagName}' for object (${object.path()}).`);
    return _default;
  }

  if (tags.length > 1) {
    silent || logger.warn(`Multiple occurences of tag '${tagName}'. Returning ${tags[0].tagValue}`);
  }

  return tags[0].tagValue;
}

export function extractUri(object: EaObject, packageUri: string, camelCase: boolean): string {
  const uri = getTagValue(object, TagName.Externaluri, null);

  if (uri) {
    return uri;
  }

  let localName = getTagValue(object, TagName.LocalName, object.name);
  localName = convertToCase(localName, camelCase, object.id);

  if (localName && localName !== '') {
    return packageUri + localName;
  }

  return `${packageUri}${object.name}`;
}

export function convertToCase(text: string, camelCase: boolean, objectGuid: number | string): string {
  const logger = getLoggerFor('ConvertToCaseFunction');

  if (text === null || text === '') {
    logger.error(`Object with ea_guid ${objectGuid} does not have a name`);
    return '';
  }

  if (camelCase) {
    return toCamelCase(text);
  }

  return toPascalCase(text);
}

function toPascalCase(text: string): string {
  return text.replace(/(?:^\w|[A-Z]|\b\w)/gu, (word: string, index: number) => word.toUpperCase()).replace(/\s+/gu, '');
}

function toCamelCase(text: string): string {
  return text.replace(/(?:^\w|[A-Z]|\b\w)/gu, (word: string, index: number) =>
    index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/gu, '');
}

export function connectorHasOldAssociationClassTags(connector: EaConnector): boolean {
  let hasOldClassTags = false;

  if (connector.associationClassId) {
    connector.tags?.forEach(tag => {
      hasOldClassTags = [
        TagName.AssociationSourcePrefix,
        TagName.AssociationSourceRevPrefix,
        TagName.AssociationDestPrefix,
        TagName.AssociationDestRevPrefix,
      ].some(prefix => tag.tagName.startsWith(prefix));
    });
  }

  return hasOldClassTags;
}

export function normalize(connector: EaConnector, elements: EaElement[]): NormalizedConnector[] {
  const normalizedConnectors: NormalizedConnector[] = [];

  if (connector.type === ConnectorType.Generalization) {
    return [];
  }

  if (connector.sourceRole && connector.sourceRole !== '') {
    normalizedConnectors.push(createNormalizedConnector(
      connector,
      connector.sourceRole,
      connector.destinationObjectId,
      connector.sourceObjectId,
      connector.sourceCardinality,
      connector.sourceRoleTags,
    ));
  }

  if (connector.destinationRole && connector.destinationRole !== '') {
    normalizedConnectors.push(createNormalizedConnector(
      connector,
      connector.destinationRole,
      connector.sourceObjectId,
      connector.destinationObjectId,
      connector.destinationCardinality,
      connector.destinationRoleTags,
    ));
  }

  if (connector.name && connector.name !== '') {
    if (connector.sourceCardinality && connector.sourceCardinality !== '') {
      normalizedConnectors.push(createNormalizedConnector(
        connector,
        connector.name,
        connector.destinationObjectId,
        connector.sourceObjectId,
        connector.sourceCardinality,
        connector.tags,
      ));
    }

    if (connector.destinationCardinality && connector.destinationCardinality !== '') {
      normalizedConnectors.push(createNormalizedConnector(
        connector,
        connector.name,
        connector.sourceObjectId,
        connector.destinationObjectId,
        connector.destinationCardinality,
        connector.tags,
      ));
    }
  }

  if (connector.associationClassId) {
    normalizedConnectors.push(...createNormalizedAssociationClassConnector(connector, elements));
  }

  if (normalizedConnectors.length === 0) {
    // Log error
  }

  return normalizedConnectors;
}

function createNormalizedConnector(
  connector: EaConnector,
  name: string,
  sourceObjectId: number,
  destinationObjectId: number,
  cardinality: string,
  tags: Tag[],
): NormalizedConnector {
  return new NormalizedConnector(
    connector,
    name,
    sourceObjectId,
    destinationObjectId,
    cardinality,
    tags,
  );
}

function createNormalizedAssociationClassConnector(
  connector: EaConnector,
  elements: EaElement[],
): NormalizedConnector[] {
  const sourceObject = elements.find(x => x.id === connector.sourceObjectId);
  const destinationObject = elements.find(x => x.id === connector.destinationObjectId);

  if (!sourceObject || !destinationObject) {
    // Log error
    return [];
  }

  let sourceObjectName = sourceObject.name;
  let destinationObjectName = destinationObject.name;

  // In case of a self-association
  if (connector.sourceObjectId === connector.destinationObjectId) {
    sourceObjectName = `${sourceObjectName}.source`;
    destinationObjectName = `${destinationObjectName}.target`;
  }

  // In case of an association class, we use the package tag of the association class
  // TODO: verify this with the editors
  // Other strategy could be to log an error if connector tags don't have a package tag
  const assocationObject = elements.find(x => x.id === connector.associationClassId);

  if (!assocationObject) {
    // Log error
    return [];
  }
  const packageName = getTagValue(assocationObject, TagName.DefiningPackage, null);

  if (!packageName) {
    // Log error
    return [];
  }

  const tag: Tag = {
    id: Date.now(),
    tagName: 'package',
    tagValue: packageName,
  };

  return [
    new NormalizedConnector(
      connector,
      sourceObjectName,
      connector.associationClassId!,
      connector.sourceObjectId,
      '1',
      [tag],
      NormalizedConnectorType.AssociationClassConnector,
    ),
    new NormalizedConnector(
      connector,
      destinationObjectName,
      connector.associationClassId!,
      connector.destinationObjectId,
      '1',
      [tag],
      NormalizedConnectorType.AssociationClassConnector,
    ),
  ];
}
