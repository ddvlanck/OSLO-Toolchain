import type { OutputHandler } from '@oslo-flanders/core';
import { Scope } from '@oslo-flanders/core';
import type { EaObject, Tag } from '@oslo-flanders/ea-extractor';
import type * as RDF from '@rdfjs/types';
import type { DataFactory } from 'rdf-data-factory';
import type { EaConverter } from '../EaConverter';
import type { UriAssigner } from '../UriAssigner';
import { getTagValue } from '../utils/utils';
import { TagName } from './TagName';

export abstract class ConverterHandler<T extends EaObject> {
  protected readonly converter: EaConverter;
  protected _factory: DataFactory | undefined;

  public constructor(converter: EaConverter) {
    this.converter = converter;
  }

  public abstract addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): Promise<void>;

  public get factory(): DataFactory {
    if (!this._factory) {
      throw new Error(`DataFactory has not been set yet.`);
    }
    return this._factory;
  }

  public set factory(value: DataFactory) {
    this._factory = value;
  }

  // FIXME: when there is no TagName.Label, do we fallback to diagram name of the object?
  public getLabel(object: T): RDF.Literal[] {
    return this.converter.configuration.specificationType === 'ApplicationProfile' ?
      this.getLanguageDependentTag(object, TagName.ApLabel, TagName.Label) :
      this.getLanguageDependentTag(object, TagName.Label);
  }

  public getDefinition(object: T): RDF.Literal[] {
    return this.converter.configuration.specificationType === 'ApplicationProfile' ?
      this.getLanguageDependentTag(object, TagName.ApDefinition, TagName.Definition) :
      this.getLanguageDependentTag(object, TagName.Definition);
  }

  public getUsageNote(object: T): RDF.Literal[] {
    return this.converter.configuration.specificationType === 'ApplicationProfile' ?
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

    if (uri.startsWith(this.converter.configuration.targetDomain)) {
      return Scope.InPublicationEnvironment;
    }

    return Scope.External;
  }

  private getLanguageDependentTag(object: T, tagName: TagName, fallbackTag?: TagName): RDF.Literal[] {
    const tags = object.tags?.filter((x: Tag) => x.tagName?.startsWith(tagName));
    const literals: RDF.Literal[] = [];

    const languageToTagValueMap = new Map<string, string>();

    if (!tags || tags.length === 0) {
      // Log warning that primary tag choice is not available, and fallback will be applied
      if (!fallbackTag) {
        // Log error that there is no fallback anymore
        return literals;
      }

      return this.getLanguageDependentTag(object, fallbackTag);
    }

    tags.forEach((tag: Tag) => {
      const parts = tag.tagName.split('-');
      const languageCode = parts[parts.length - 1];

      if (languageToTagValueMap.has(languageCode)) {
        // TODO: add option to log silently
        // Log warning that object has multiple occurrences and will be overriden
      }

      const tagValue = tag.tagValue;
      if (!tagValue) {
        // Log warning for empty field?
        return;
      }

      literals.push(this.factory.literal(tagValue.trim(), languageCode));
    });

    return literals;
  }
}
