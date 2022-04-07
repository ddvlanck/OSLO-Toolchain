import type { OutputHandler } from '@oslo-flanders/core';
import { Converter, getLoggerFor } from '@oslo-flanders/core';
import type { Configuration } from '@oslo-flanders/ea-converter-configuration';
import type { EaDiagram, EaDocument } from '@oslo-flanders/ea-extractor';
import { DataExtractor } from '@oslo-flanders/ea-extractor';

import { AttributeConverterHandler } from './converter-handlers/AttributeConverterHandler';
import { ConnectorConverterHandler } from './converter-handlers/ConnectorConverterHandler';
import { ElementConverterHandler } from './converter-handlers/ElementConverterHandler';
import { PackageConverterHandler } from './converter-handlers/PackageConverterHandler';

import type { ConverterHandler } from './types/ConverterHandler';
import { UriAssigner } from './UriAssigner';

export class EaConverter extends Converter {
  private readonly logger = getLoggerFor(this);

  // TODO: voc or ap parameter
  private readonly configuration: Configuration;
  private readonly converterHandlers: ConverterHandler[];

  public constructor(configuration: Configuration, outputHandler: OutputHandler) {
    super(configuration.umlFile, outputHandler);

    this.configuration = configuration;
    this.converterHandlers = [
      new PackageConverterHandler(),
      new ElementConverterHandler(),
      new AttributeConverterHandler(),
      new ConnectorConverterHandler(),
    ];
  }

  public async convert(): Promise<void> {
    const extractor = new DataExtractor(this.configuration.umlFile);
    const uriAssigner = new UriAssigner();

    const eaDocument = await extractor.extractData();
    const targetDiagram = this.getTargetDiagram(eaDocument);

    if (!targetDiagram) {
      return;
    }

    this.converterHandlers.forEach(handler => handler.documentNotification(eaDocument));
    uriAssigner.assignUris(
      targetDiagram,
      this.packageConverterHandler,
      this.elementConverterHandler,
      this.attributeConverterHandler,
      this.connectorConverterHandler,
    );

    this.converterHandlers.forEach(handler => handler.convertToOslo(uriAssigner, this.outputHandler));

    //await this.outputHandler.write();
  }

  // TODO: Filter EaDocument immediatly (based on configured diagram name, in extractor)
  // TODO: Test OSLO-Air-and-Water for extra packages
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

  private get packageConverterHandler(): PackageConverterHandler {
    return <PackageConverterHandler>
      this.converterHandlers.find(x => x.constructor.name === 'PackageConverterHandler')!;
  }

  private get elementConverterHandler(): ElementConverterHandler {
    return <ElementConverterHandler>
      this.converterHandlers.find(x => x.constructor.name === 'ElementConverterHandler')!;
  }

  private get attributeConverterHandler(): AttributeConverterHandler {
    return <AttributeConverterHandler>
      this.converterHandlers.find(x => x.constructor.name === 'AttributeConverterHandler')!;
  }

  private get connectorConverterHandler(): ConnectorConverterHandler {
    return <ConnectorConverterHandler>
      this.converterHandlers.find(x => x.constructor.name === 'ConnectorConverterHandler')!;
  }
}
