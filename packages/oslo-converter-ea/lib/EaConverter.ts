import type { EaConverterConfiguration } from '@oslo-flanders/configuration';
import { Converter } from '@oslo-flanders/core';
import type { EaAttribute, EaConnector, EaDiagram, EaElement, EaObject, EaPackage } from '@oslo-flanders/ea-extractor';
import { ConnectorType, DataExtractor } from '@oslo-flanders/ea-extractor';

import { AttributeConverterHandler } from './converterHandlers/AttributeConverterHandler';
import { ConnectorConverterHandler } from './converterHandlers/ConnectorConverterHandler';
import { ElementConverterHandler } from './converterHandlers/ElementConverterHandler';
import { PackageConverterHandler } from './converterHandlers/PackageConverterHandler';

import { NormalizedConnectorType } from './types/NormalizedConnector';
import type { NormalizedConnector } from './types/NormalizedConnector';

import { UriAssigner } from './UriAssigner';
import { ignore, normalize } from './utils/utils';

export enum NotificationMessage {
  AddElementToOutput
}

export class EaConverter extends Converter<EaConverterConfiguration> {
  private readonly extractor: DataExtractor;
  private readonly uriAssigner: UriAssigner;
  private normalizedConnectors: NormalizedConnector[];
  private readonly elementConverterHandler: ElementConverterHandler;
  private readonly connectorConverterHandler: ConnectorConverterHandler;
  private readonly attributeConverterHandler: AttributeConverterHandler;
  private readonly packageConverterHandler: PackageConverterHandler;

  public constructor() {
    super();
    this.extractor = new DataExtractor();
    this.uriAssigner = new UriAssigner();
    this.normalizedConnectors = [];

    this.elementConverterHandler = new ElementConverterHandler(this);
    this.connectorConverterHandler = new ConnectorConverterHandler(this);
    this.attributeConverterHandler = new AttributeConverterHandler(this);
    this.packageConverterHandler = new PackageConverterHandler(this);
  }

  public async convert(): Promise<void> {
    await this.extractor.extractData(this.configuration.umlFile);
    this.extractor.setTargetDiagram(this.configuration.diagramName);

    // Normalize the connectors
    this.normalizeConnectors(this.extractor.connectors);

    await this.uriAssigner.assignUris(
      this.getTargetDiagram(),
      this.getPackages(),
      this.getElements(),
      this.getAttributes(),
      this.getConnectors(),
    );

    [
      this.packageConverterHandler,
      this.elementConverterHandler,
      this.attributeConverterHandler,
      this.connectorConverterHandler,
    ].forEach(handler => {
      handler.factory = this.outputHandler.factory;
    });

    // These elements must be added to the store before we can process attributes and connectors
    await Promise.all([
      this.packageConverterHandler.addObjectsToOutput(this.uriAssigner, this.outputHandler),
      this.elementConverterHandler.addObjectsToOutput(this.uriAssigner, this.outputHandler),
    ]);

    await Promise.all([
      this.attributeConverterHandler.addObjectsToOutput(this.uriAssigner, this.outputHandler),
      this.connectorConverterHandler.addObjectsToOutput(this.uriAssigner, this.outputHandler),
    ]);

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

  public notify(message: NotificationMessage, object: EaObject): void {
    switch (message) {
      case NotificationMessage.AddElementToOutput:
        return this.addElementToOutput(<EaElement>object);

      default:
        throw new Error('Notification message not understood by converter');
    }
  }

  private addElementToOutput(element: EaElement): void {
    this.elementConverterHandler.addObjectToOutput(
      element,
      this.getTargetDiagram(),
      this.uriAssigner,
      this.outputHandler,
    );
  }
}
