import type { OutputHandler } from '@oslo-flanders/core';
import { Scope } from '@oslo-flanders/core';
import type { EaDiagram, EaDocument, EaObject, Tag } from '@oslo-flanders/ea-extractor';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';
import { TagName } from './TagName';

export abstract class ConverterHandler<T extends EaObject> {
  public objects: T[];
  public readonly targetDiagram: EaDiagram;
  public readonly specifcationType: string;
  public readonly targetDomain: string;

  public constructor(targetDiagram: EaDiagram, specificationType: string, targetDomain: string) {
    this.objects = [];
    this.targetDiagram = targetDiagram;
    this.specifcationType = specificationType;
    this.targetDomain = targetDomain;
  }

  public get name(): string {
    return this.constructor.name;
  }

  public abstract documentNotification(document: EaDocument): void;
  public abstract createOsloObject(uriAssigner: UriAssigner, outputHandler: OutputHandler): void;

  public getLabel(object: T): Map<string, string> {
    return this.specifcationType === 'ApplicationProfile' ?
      this.getLanguageDependentTag(object, TagName.ApLabel, TagName.Label) :
      this.getLanguageDependentTag(object, TagName.Label);
  }

  public getDefinition(object: T): Map<string, string> {
    return this.specifcationType === 'ApplicationProfile' ?
      this.getLanguageDependentTag(object, TagName.ApDefinition, TagName.Definition) :
      this.getLanguageDependentTag(object, TagName.Definition);
  }

  public getUsageNote(object: T): Map<string, string> {
    return this.specifcationType === 'ApplicationProfile' ?
      this.getLanguageDependentTag(object, TagName.ApUsageNote, TagName.UsageNote) :
      this.getLanguageDependentTag(object, TagName.UsageNote);
  }

  // TODO: watch out for URI tags containing a data.vlaanderen URI
  public getScope(object: T, packageBaseUri: string, idUriMap: Map<number, string>): Scope {
    const uri = getTagValue(object, TagName.ExternalUri, null) || idUriMap.get(object.id);

    if (!uri) {
      // TODO: log error
      return Scope.Undefined;
    }

    if (uri.startsWith(packageBaseUri)) {
      return Scope.InPackage;
    }

    if (uri.startsWith(this.targetDomain)) {
      return Scope.InPublicationEnvironment;
    }

    return Scope.External;
  }

  private getLanguageDependentTag(object: T, tagName: TagName, fallbackTag?: TagName): Map<string, string> {
    const tags = object.tags?.filter((x: Tag) => x.tagName.startsWith(tagName));

    const languageToTagValueMap = new Map<string, string>();

    if (!tags || tags.length === 0) {
      // Log warning that primary tag choice is not available, and fallback will be applied
      if (!fallbackTag) {
        // Log error that there is no fallback anymore
        return languageToTagValueMap;
      }

      return this.getLanguageDependentTag(object, fallbackTag);
    }

    tags.forEach((tag: Tag) => {
      const parts = tag.tagName.split('-');
      const languageCode = parts[parts.length - 1];

      if (languageToTagValueMap.has(languageCode)) {
        // TODO: add option to log silently
        // logger.warn(`Object (${object.path()}) contains multiple occurrcences of ${tag.tagName} and will be overridden.`);
      }

      const tagValue = tag.tagValue.trim();
      if (!tagValue) {
        // Log warning for empty field?
        return;
      }

      languageToTagValueMap.set(languageCode, tagValue);
    });

    return languageToTagValueMap;
  }
}
