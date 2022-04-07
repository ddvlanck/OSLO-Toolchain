import type { OutputHandler } from '@oslo-flanders/core';
import type { EaDocument } from '@oslo-flanders/ea-extractor';
import type { UriAssigner } from '../UriAssigner';

export abstract class ConverterHandler {
  public objects: any[];

  public constructor() {
    this.objects = [];
  }

  public abstract documentNotification(document: EaDocument): void;
  public abstract convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void;
}
