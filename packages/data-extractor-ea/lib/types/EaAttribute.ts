import type { EaElement } from './EaElement';

export interface EaAttribute extends EaElement {
  classId: number;
  type: string;
  lowerBound: string;
  upperBound: string;
}
