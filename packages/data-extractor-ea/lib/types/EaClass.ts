import type { EaElement } from './EaElement';

export interface EaClass extends EaElement {
  parentId?: number;
  // Type: string; // If we want to store packages and notes as well
  // Note: string; // If we want to add the value of attached notes
}
