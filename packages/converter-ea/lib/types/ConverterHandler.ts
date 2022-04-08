import type { OutputHandler } from '@oslo-flanders/core';
import type { EaDiagram, EaDocument } from '@oslo-flanders/ea-extractor';
import type { UriAssigner } from '../UriAssigner';

export abstract class ConverterHandler {
  public objects: any[];
  public readonly targetDiagram: EaDiagram;

  public constructor(targetDiagram: EaDiagram) {
    this.objects = [];
    this.targetDiagram = targetDiagram;
  }

  public get name(): string {
    return this.constructor.name;
  }

  public abstract documentNotification(document: EaDocument): void;
  public abstract convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void;
}
