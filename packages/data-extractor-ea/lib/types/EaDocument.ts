import { getLoggerFor } from '@oslo-flanders/types';
import type { EaAttribute } from './EaAttribute';
import type { EaConnector } from './EaConnector';
import type { EaDiagram } from './EaDiagram';
import type { EaElement } from './EaElement';
import type { EaPackage } from './EaPackage';
import type { EaObject } from './Object';

/**
 * Contains all packages, attributes, elements, diagrams and connectors
 * from an Enterprise Architect file
 */
export class EaDocument {
  private readonly connectors: EaConnector[];
  private readonly attributes: EaAttribute[];
  private readonly elements: EaElement[];
  private readonly packages: EaPackage[];
  private readonly diagrams: EaDiagram[];

  private readonly logger = getLoggerFor(this);

  public constructor(
    connectors: EaConnector[],
    attributes: EaAttribute[],
    elements: EaElement[],
    packages: EaPackage[],
    diagrams: EaDiagram[],
  ) {
    this.connectors = connectors.sort(this.sortById);
    this.attributes = attributes.sort(this.sortById);
    this.elements = elements.sort(this.sortById);
    this.packages = packages.sort(this.sortById);
    this.diagrams = diagrams.sort(this.sortById);
  }

  public printDebugInfo(): void {
    this.logger.debug(`Printing debug information for EaDocument:`);

    this.logger.debug('packages', this.packages);
    this.logger.debug('connectors', this.connectors);
    this.logger.debug('elements', this.elements);
    this.logger.debug('attributes', this.attributes);
    this.logger.debug('diagrams', this.diagrams);
  }

  public get eaConnectors(): EaConnector[] {
    return this.connectors;
  }

  public get eaElements(): EaElement[] {
    return this.elements;
  }

  public get eaAttributes(): EaAttribute[] {
    return this.attributes;
  }

  public get eaPackages(): EaPackage[] {
    return this.packages;
  }

  public get eaDiagrams(): EaDiagram[] {
    return this.diagrams;
  }

  private readonly sortById = (objectA: EaObject, objectB: EaObject): number => objectA.id - objectB.id;
}
