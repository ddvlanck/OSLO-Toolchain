import { Converter, getLoggerFor } from '@oslo-flanders/core';
import type { Configuration } from '@oslo-flanders/ea-converter-configuration';
import type { EaConnector, EaDiagram, EaDocument, EaElement } from '@oslo-flanders/ea-extractor';
import { DataExtractor } from '@oslo-flanders/ea-extractor';
import type { NormalizedConnector } from './types/connectors/NormalizedConnector';
import { NormalizedConnectorType } from './types/connectors/NormalizedConnector';
import { UriAssigner } from './UriAssigner';

import { ignore, normalize } from './utils/utils';

export class EaConverter extends Converter {
  private readonly logger = getLoggerFor(this);

  private readonly extractor: DataExtractor;
  // TODO: voc or ap parameter
  private readonly configuration: Configuration;

  // FIXME: outputhandler should be added as parameter as well
  public constructor(configuration: Configuration) {
    super(configuration.umlFile);

    this.configuration = configuration;
    this.extractor = new DataExtractor(this.configuration.umlFile);
  }

  public async convert(): Promise<any> {
    const eaDocument = await this.extractor.extractData();
    const targetDiagram = this.getTargetDiagram(eaDocument);

    if (!targetDiagram) {
      return;
    }

    const filteredPackages = eaDocument.eaPackages.filter(x => !ignore(x, false));
    const filteredElements = eaDocument.eaElements.filter(x => !ignore(x, false));
    const filteredAttributes = eaDocument.eaAttributes.filter(x => !ignore(x, false));
    const normalizedConnectors = this.normalizeConnectors(eaDocument.eaConnectors, filteredElements);

    const uriAssigner = new UriAssigner();
    uriAssigner.assignUris(
      targetDiagram,
      filteredPackages,
      filteredElements,
      filteredAttributes,
      normalizedConnectors,
    );
    // TODO: convert packages

    // TODO: convert elements

    // TODO: convert connectors

    // TODO: convert non-enum attributes

    // TODO; convert enum values
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

  private normalizeConnectors(connectors: EaConnector[], elements: EaElement[]): NormalizedConnector[] {
    const normalizedConnectors: NormalizedConnector[] = [];
    connectors.forEach(connector => normalize(connector, normalizedConnectors));

    // Add names for the association class connectors
    normalizedConnectors.forEach(connector => {
      if (connector.type === NormalizedConnectorType.AssociationClassConnector) {
        const classObject = elements.find(x => x.id === connector.destinationObjectId);

        if (!classObject) {
          // TODO: Log warning
          console.log(`Can't find object for id ${connector.destinationObjectId}`);
        } else {
          connector.addNameTag(classObject.name);
        }
      }
    });

    return normalizedConnectors;
  }
}
