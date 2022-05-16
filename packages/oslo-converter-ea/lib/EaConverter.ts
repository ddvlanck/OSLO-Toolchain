import type { EaConverterConfiguration } from '@oslo-flanders/configuration';
import { Converter } from '@oslo-flanders/core';
import type { EaDiagram, EaDocument } from '@oslo-flanders/ea-extractor';
import { DataExtractor } from '@oslo-flanders/ea-extractor';

import { AttributeConverterHandler } from './converterHandlers/AttributeConverterHandler';
import { ConnectorConverterHandler } from './converterHandlers/ConnectorConverterHandler';
import { ElementConverterHandler } from './converterHandlers/ElementConverterHandler';
import { PackageConverterHandler } from './converterHandlers/PackageConverterHandler';

import type { ConverterHandler, GenericOsloType } from './types/ConverterHandler';
import { UriAssigner } from './UriAssigner';

export class EaConverter extends Converter<EaConverterConfiguration> {
  private converterHandlers: ConverterHandler<GenericOsloType>[] = [];

  public async convert(): Promise<void> {
    const extractor = new DataExtractor(this.configuration.umlFile);
    const uriAssigner = new UriAssigner();

    const eaDocument = await extractor.extractData();
    const targetDiagram = this.getTargetDiagram(eaDocument);

    if (!targetDiagram) {
      return;
    }

    this.attachHandlers(targetDiagram);
    this.converterHandlers.forEach(handler => handler.documentNotification(eaDocument));

    uriAssigner.assignUris(
      targetDiagram,
      this.converterHandlers,
    );

    this.converterHandlers.forEach(handler => handler.createOsloObject(uriAssigner, this.outputHandler));

    await this.outputHandler.write(this.configuration.outputFile);
  }

  private getTargetDiagram(eaDocument: EaDocument): EaDiagram | null {
    const filteredDiagram = eaDocument.eaDiagrams.filter(x => x.name === this.configuration.diagramName);

    if (filteredDiagram.length > 1) {
      this.logger.error(`Multiple diagrams share the same name '${this.configuration.diagramName}'. Aborting conversion.`);
      return null;
    }

    if (filteredDiagram.length === 0) {
      this.logger.error(`UML model does not contain a diagram with name ${this.configuration.diagramName}.`);
      return null;
    }

    return filteredDiagram[0];
  }

  private attachHandlers(targetDiagram: EaDiagram): void {
    this.converterHandlers = [
      new PackageConverterHandler(targetDiagram, this.configuration.specificationType, this.configuration.targetDomain),
      new ElementConverterHandler(targetDiagram, this.configuration.specificationType, this.configuration.targetDomain),
      new AttributeConverterHandler(targetDiagram, this.configuration.specificationType, this.configuration.targetDomain),
      new ConnectorConverterHandler(targetDiagram, this.configuration.specificationType, this.configuration.targetDomain),
    ];
  }
}
