import type { EaConverterConfiguration } from '@oslo-flanders/configuration';
import { Converter } from '@oslo-flanders/core';
import type { EaAttribute, EaConnector, EaDiagram, EaElement, EaObject, EaPackage } from '@oslo-flanders/ea-extractor';
import { ConnectorType, DataExtractor } from '@oslo-flanders/ea-extractor';

import type { DataFactory } from 'rdf-data-factory';
import { AttributeConverterHandler } from './converterHandlers/AttributeConverterHandler';
import { ConnectorConverterHandler } from './converterHandlers/ConnectorConverterHandler';
import { ElementConverterHandler } from './converterHandlers/ElementConverterHandler';
import { PackageConverterHandler } from './converterHandlers/PackageConverterHandler';

import type { ConverterHandler } from './types/ConverterHandler';
import { NormalizedConnectorType } from './types/NormalizedConnector';
import type { NormalizedConnector } from './types/NormalizedConnector';

import { UriAssigner } from './UriAssigner';
import { ignore, normalize } from './utils/utils';

export class EaConverter extends Converter<EaConverterConfiguration> {
  private readonly extractor: DataExtractor;
  private normalizedConnectors: NormalizedConnector[];

  public constructor() {
    super();
    this.extractor = new DataExtractor();
    this.normalizedConnectors = [];
  }

  public async convert(): Promise<void> {
    await this.extractor.extractData(this.configuration.umlFile);
    this.extractor.setTargetDiagram(this.configuration.diagramName);

    // Normalize the connectors
    this.normalizeConnectors(this.extractor.connectors);

    const uriAssigner = new UriAssigner();
    await uriAssigner.assignUris(
      this.getTargetDiagram(),
      this.getPackages(),
      this.getElements(),
      this.getAttributes(),
      this.getConnectors(),
    );

    const converterHandlers = this.getConverterHandlers(this.outputHandler.factory);
    converterHandlers.forEach(handler => handler.addObjectsToOutput(uriAssigner, this.outputHandler));

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

  public getGeneralizationConnectors(): EaConnector[] {
    return this.extractor.connectors.filter(x => x.type === ConnectorType.Generalization);
  }

  public getConnectors(): NormalizedConnector[] {
    return this.normalizedConnectors;
  }

  public getTargetDiagram(): EaDiagram {
    return this.extractor.targetDiagram;
  }

  private getConverterHandlers(factory: DataFactory): ConverterHandler<EaObject>[] {
    return [
      new ConnectorConverterHandler(this, factory),
      new PackageConverterHandler(this, factory),
      new ElementConverterHandler(this, factory),
      new AttributeConverterHandler(this, factory),
    ];
  }

  private normalizeConnectors(connectors: EaConnector[]): void {
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

    this.normalizedConnectors = normalizedConnectors;
  }
}
