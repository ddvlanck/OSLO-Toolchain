import { Logger } from '@oslo-flanders/types';
import type { EaConnector } from '../types/EaConnector';
import type { EaElement } from '../types/EaElement';
import type { Tag } from '../types/Tag';

export function addEaTagsToElements(
  tags: any[],
  elements: EaElement[],
  objectIdPropertyName: string,
  tagValueName: string,
): void {
  const logger = Logger.getInstanceFor('AddEaTagsToElements');

  tags.forEach(tag => {
    const element = elements.find(x => x.id === tag[objectIdPropertyName]);

    if (!element) {
      //logger.log(LOG_LEVELS[0], `Could not find EA Element with ID ${tag[objectIdPropertyName]} to add tag to.`);
    } else {
      const eaTag: Tag = {
        id: <number>tag.PropertyID,
        tagName: <string>tag.Property,
        tagValue: <string>tag[tagValueName],
      };

      element.tags = element.tags ? [...element.tags, eaTag] : [eaTag];
    }
  });
}

export function addRoleTagsToElements(
  tags: any[],
  eaConnectors: EaConnector[],
): void {
  eaConnectors.forEach(con => {
    const connectorRoleTags = tags.filter(x => x.ElementID === con.guid);

    if (connectorRoleTags.length === 0) {
      return;
    }

    connectorRoleTags.forEach(roleTag => {
      const eaRoleTag: Tag = {
        id: <string>roleTag.PropertyID,
        tagName: <string>roleTag.TagValue,
        tagValue: <string>roleTag.Notes,
      };

      if (roleTag.BaseClass === 'ASSOCIATION_TARGET') {
        con.sourceRoleTags = con.sourceRoleTags ? [...con.sourceRoleTags, eaRoleTag] : [eaRoleTag];
      }

      if (roleTag.BaseClass === 'ASSOCIATION_TARGET') {
        con.destinationRoleTags = con.destinationRoleTags ? [...con.destinationRoleTags, eaRoleTag] : [eaRoleTag];
      }
    });
  });
}

