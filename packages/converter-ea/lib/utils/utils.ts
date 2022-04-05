// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-unused-expressions */
import { getLoggerFor } from '@oslo-flanders/core';
import type { EaConnector, EaObject } from '@oslo-flanders/ea-extractor';
import { NormalizedConnector, NormalizedConnectorType } from '../types/connectors/NormalizedConnector';
import { TagName } from '../types/TagName';

export function ignore(object: EaObject, _default: any): boolean {
  const ignoreObject = getTagValue(object, TagName.Ignore, false, true);
  return Boolean(ignoreObject);
}

// TODO: see getTagValues function
// TODO: fix any type for object
export function getTagValue(object: any, tagName: TagName, _default: any, silent = true): string {
  const logger = getLoggerFor('GetTagValueFunction');
  const tags = object.tags?.filter((x: any) => x.tagName === tagName);

  if (!tags || tags.length === 0) {
    silent || logger.warn(`Missing tag '${tagName}' for object with ea_guid ${object.guid}.`);
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

/*function extractAssociationElementWithDeprecatedTags(
  connector: EaConnector,
  direction: ConnectorDirection,
): EaConnector[] {
  if (!connector.associationClassId) {
    return [connector];
  }

  const prefixes: string[] = [
    TagName.AssociationSourcePrefix,
    TagName.AssociationSourceRevPrefix,
    TagName.AssociationDestPrefix,
    TagName.AssociationDestRevPrefix,
  ];

  let connectionParts: number[] = [
    AssociationClassConnectionPart.SourceToAssociation,
    AssociationClassConnectionPart.AssociationToSource,
    AssociationClassConnectionPart.AssociationToDestination,
    AssociationClassConnectionPart.DestinationToAssociation,
  ];

  if (direction === ConnectorDirection.DestToSource) {
    connectionParts = connectionParts.reverse();
  }

  const connectors: EaConnector[] = [];
  for (let i = 0; i < 4; i++) {
    connectors.push(new AssociationClassConnector(connector, connectionParts[i], prefixes[i]));
  }

  return connectors;
}*/

export function normalize(connector: EaConnector, normalizedConnectors: NormalizedConnector[]): void {
  if (connector.sourceRole && connector.sourceRole !== '') {
    normalizedConnectors.push(new NormalizedConnector(
      connector,
      connector.sourceRole,
      connector.destinationObjectId,
      connector.sourceObjectId,
      connector.sourceCardinality,
      connector.sourceRoleTags || [],
      NormalizedConnectorType.RegularConnector,
    ));
  }

  if (connector.destinationRole && connector.destinationRole !== '') {
    normalizedConnectors.push(new NormalizedConnector(
      connector,
      connector.destinationRole,
      connector.sourceObjectId,
      connector.destinationObjectId,
      connector.destinationCardinality,
      connector.destinationRoleTags || [],
      NormalizedConnectorType.RegularConnector,
    ));
  }

  if (connector.name && connector.name !== '') {
    if (connector.sourceCardinality && connector.sourceCardinality !== '') {
      normalizedConnectors.push(new NormalizedConnector(
        connector,
        connector.name,
        connector.destinationObjectId,
        connector.sourceObjectId,
        connector.sourceCardinality,
        connector.tags || [],
        NormalizedConnectorType.RegularConnector,
      ));
    }

    if (connector.destinationCardinality && connector.destinationCardinality !== '') {
      normalizedConnectors.push(new NormalizedConnector(
        connector,
        connector.name,
        connector.sourceObjectId,
        connector.destinationObjectId,
        connector.destinationCardinality,
        connector.tags || [],
        NormalizedConnectorType.RegularConnector,
      ));
    }
  }

  if (connector.associationClassId) {
    normalizedConnectors.push(
      new NormalizedConnector(
        connector,
        '',
        connector.associationClassId,
        connector.sourceObjectId,
        '1',
        connector.tags || [],
        NormalizedConnectorType.AssociationClassConnector,
      ),
      new NormalizedConnector(
        connector,
        '',
        connector.associationClassId,
        connector.destinationObjectId,
        '1',
        connector.tags || [],
        NormalizedConnectorType.AssociationClassConnector,
      ),
    );
  }

  // TODO: handle case where there are roles AND there is a name as well
}
