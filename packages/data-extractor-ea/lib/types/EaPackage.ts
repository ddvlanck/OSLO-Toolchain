import type { EaElement } from './EaElement';

// TODO: verify this with existing OSLO-EA-to-RDF
export interface EaPackage extends EaElement {
  name: string;
  packageId: number;
  parentId: number;
}
