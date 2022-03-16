import { Logger } from '@oslo-flanders/types';
import type { EaAttribute } from './EaAttribute';
import type { EaClass } from './EaClass';
import type { EaConnector } from './EaConnector';
import type { EaPackage } from './EaPackage';

export class EaDocument {
  public connectors: EaConnector[];
  public classes: EaClass[];
  public attributes: EaAttribute[];
  public packages: EaPackage[];

  private readonly logger = Logger.getInstanceFor(this);

  public constructor(connectors: EaConnector[], classes: EaClass[], atttributes: EaAttribute[], packages: EaPackage[]) {
    this.connectors = connectors;
    this.classes = classes;
    this.attributes = atttributes;
    this.packages = packages;
  }

  // TODO: add function that logs the whole document
}
