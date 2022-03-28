// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-unused-expressions */
import type { EaConnector, EaObject } from '@oslo-flanders/ea-data-extractor';
import { ConnectorDirection } from '@oslo-flanders/ea-data-extractor';
import { getLoggerFor } from '@oslo-flanders/types';
import { AssociationFreeConnector } from '../types/connectors/AssocationFreeConnector';
import { AssociationClassConnectionPart } from '../types/connectors/AssociationClassConnectionPart';
import { AssociationClassConnector } from '../types/connectors/AssociationClassConnector';
import { RoleConnectionPart, RoleConnector } from '../types/connectors/RoleConnector';
import { TagName } from '../types/TagName';

export function ignore(object: EaObject, _default: any): boolean {
  const ignoreObject = getTagValue(object, TagName.Ignore, false, true);
  return Boolean(ignoreObject);
}

export function getTagValue(object: EaObject, tagName: TagName, _default: any, silent = true): string {
  const logger = getLoggerFor('GetTagValueFunction');
  const tags = object.tags?.filter(x => x.tagName === tagName);

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
  localName = convertToCase(localName, camelCase, object.guid);

  if (localName && localName !== '') {
    return packageUri + localName;
  }

  return `${packageUri}${object.name}`;
}

export function convertToCase(text: string, camelCase: boolean, objectGuid: string): string {
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

export function extractAssociationElement(connector: EaConnector, direction: ConnectorDirection): EaConnector[] {
  const logger = getLoggerFor('ExtractAssociationElementFunction');
  let result: EaConnector[] = [];

  if (connectorHasOldAssociationClassTags(connector)) {
    logger.debug(`Add connectors based on deprecated tags for connector with ea_guid ${connector.guid}`);
    result = extractAssociationElementWithDeprecatedTags(connector, direction);
  } else {
    if ((!connector.destinationRole || connector.destinationRole === '') &&
      (!connector.sourceRole || connector.sourceRole === '') &&
      (direction !== ConnectorDirection.Unspecified)) {
      logger.debug(`Add AssociationFree connector for ea_guid ${connector.guid}`);
      result.push(new AssociationFreeConnector(connector));
    }

    if (connector.sourceRole && connector.sourceRole !== '') {
      result.push(new RoleConnector(connector, RoleConnectionPart.DestToSource));
      logger.debug(`Add RoleConnector for connector (${connector.guid})`);
    }

    if (connector.destinationRole && connector.destinationRole !== '') {
      result.push(new RoleConnector(connector, RoleConnectionPart.SourceToDest));
      logger.debug(`Add RoleConnector for connector (${connector.guid})`);
    }

    if ((connector.destinationRole && connector.destinationRole !== '') &&
      (connector.sourceRole && connector.sourceRole !== '') &&
      (direction === ConnectorDirection.Unspecified)) {
      logger.debug(`Add RoleConnectors for connector (${connector.guid})`);
      result.push(
        new RoleConnector(connector, RoleConnectionPart.UnspecifiedSourceToDest),
        new RoleConnector(connector, RoleConnectionPart.UnspecifiedDestToSource),
      );
    }
  }

  return result;
}

function extractAssociationElementWithDeprecatedTags(
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
}
