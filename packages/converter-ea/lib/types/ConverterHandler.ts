import type { OutputHandler } from '@oslo-flanders/core';
import { Scope } from '@oslo-flanders/core';
import type { EaDiagram, EaDocument, Tag } from '@oslo-flanders/ea-extractor';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';
import { TagName } from './TagName';

export abstract class ConverterHandler {
  public objects: any[];
  public readonly targetDiagram: EaDiagram;
  public readonly specifcationType: string;

  public constructor(targetDiagram: EaDiagram, specificationType: string) {
    this.objects = [];
    this.targetDiagram = targetDiagram;
    this.specifcationType = specificationType;
  }

  public get name(): string {
    return this.constructor.name;
  }

  public abstract documentNotification(document: EaDocument): void;
  public abstract convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void;

  public getLabel(object: any): Map<string, string> {
    return this.specifcationType === 'ApplicationProfile' ?
      this.getLanguageDependentTag(object, TagName.ApLabel, TagName.Label) :
      this.getLanguageDependentTag(object, TagName.Label);
  }

  public getDefinition(object: any): Map<string, string> {
    return this.specifcationType === 'ApplicationProfile' ?
      this.getLanguageDependentTag(object, TagName.ApDefinition, TagName.Definition) :
      this.getLanguageDependentTag(object, TagName.Definition);
  }

  public getUsageNote(object: any): Map<string, string> {
    return this.specifcationType === 'ApplicationProfile' ?
      this.getLanguageDependentTag(object, TagName.ApUsageNote, TagName.UsageNote) :
      this.getLanguageDependentTag(object, TagName.UsageNote);
  }

  public getScope(object: any, packageBaseUri: string, idUriMap: Map<number, string>): Scope {
    const externalUri = getTagValue(object, TagName.Externaluri, null);

    if (externalUri) {
      return Scope.External;
    }

    // TODO: log error if it not exists?
    const objectUri = idUriMap.get(object.id)!;

    if (objectUri.startsWith(packageBaseUri)) {
      return Scope.InPackage;
    }

    return Scope.InPublicationEnvironment;
  }

  private getLanguageDependentTag(object: any, tagName: TagName, fallbackTag?: TagName): Map<string, string> {
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
