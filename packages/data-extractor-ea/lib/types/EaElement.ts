import type { EaObject } from './Object';

/**
 * Enumeration to reference the element type
 */
export enum ElementType {
  Class,
  DataType,
  Enumeration
}

// TODO: make it a class
/**
 * Represents an element in Enterprise Architect
 * @see ElementType for possible types of an EaElement
 */
export interface EaElement extends EaObject {
  type: ElementType;
  packageId: number;
}
