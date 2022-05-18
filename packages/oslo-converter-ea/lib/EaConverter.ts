import type { EaConverterConfiguration } from '@oslo-flanders/configuration';
import { Converter } from '@oslo-flanders/core';
import type { EaAttribute, EaConnector, EaDiagram, EaElement, EaObject, EaPackage } from '@oslo-flanders/ea-extractor';
import { DataExtractor } from '@oslo-flanders/ea-extractor';

import { AttributeConverterHandler } from './converterHandlers/AttributeConverterHandler';
import { ConnectorConverterHandler } from './converterHandlers/ConnectorConverterHandler';
import { ElementConverterHandler } from './converterHandlers/ElementConverterHandler';
import { PackageConverterHandler } from './converterHandlers/PackageConverterHandler';

import type { ConverterHandler } from './types/ConverterHandler';
import type { NormalizedConnector } from './types/NormalizedConnector';
import { NormalizedConnectorType } from './types/NormalizedConnector';
import { UriAssigner } from './UriAssigner';
import { ignore, normalize } from './utils/utils';

export class EaConverter extends Converter<EaConverterConfiguration> {
  private converterHandlers: ConverterHandler<EaObject>[] = [];
  private readonly extractor: DataExtractor;

  public constructor() {
    super();

    this.extractor = new DataExtractor();
    this.attachHandlers();
  }

  public async convert(): Promise<void> {
    await this.extractor.extractData(this.configuration.umlFile);
    this.extractor.setTargetDiagram(this.configuration.diagramName);

    const uriAssigner = new UriAssigner();
    await uriAssigner.assignUris(
      this.getTargetDiagram(),
      this.getPackages(),
      this.getElements(),
      this.getAttributes(),
      this.getConnectors(),
    );

    this.converterHandlers.forEach(handler => handler.createOsloObject(uriAssigner, this.outputHandler));

    await this.outputHandler.write(this.configuration.outputFile);
  }

  public getPackages(): EaPackage[] {
    return this.extractor.packages.filter(x => !ignore(x));
  }

  public getAttributes(): EaAttribute[] {
    return this.extractor.attributes.filter(x => !ignore(x));
  }

  public getElements(): EaElement[] {
    return this.extractor.elements.filter(x => !ignore(x));
  }

  public getConnectors(): NormalizedConnector[] {
    const filtered = this.extractor.connectors.filter(x => !ignore(x));
    return this.normalizeConnectors(filtered);
  }

  public getTargetDiagram(): EaDiagram {
    return this.extractor.targetDiagram;
  }

  private attachHandlers(): void {
    this.converterHandlers = [
      new PackageConverterHandler(this),
      new ElementConverterHandler(this),
      new AttributeConverterHandler(this),
      new ConnectorConverterHandler(this),
    ];
  }

  private normalizeConnectors(connectors: EaConnector[]): NormalizedConnector[] {
    const normalizedConnectors: NormalizedConnector[] = [];
    const elements = this.getElements();

    connectors.forEach(connector => {
      const normalized = normalize(connector, elements);
      normalizedConnectors.push(...normalized);
    });

    // Add names for the association class connectors
    normalizedConnectors.forEach(connector => {
      if (connector.type === NormalizedConnectorType.AssociationClassConnector) {
        const destinationClass = elements.find(x => x.id === connector.destinationObjectId);

        if (!destinationClass) {
          // TODO: Log warning
          console.log(`Can't find object for id ${connector.destinationObjectId}.`);
        } else {
          connector.addNameTag(destinationClass.name);
        }
      }
    });

    return normalizedConnectors;
  }
}
