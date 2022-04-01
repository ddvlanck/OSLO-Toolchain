import type { EaObject } from './Object';

/**
 * Represents a package in Enterprise Architect
 *
 * A package has two fields pointing to an identifier:
 * - id (inferred from EaObject) - references the object id
 * - packageId - references the actual packageId which must be used by other objects
 * to refer to the package
 */
export interface EaPackage extends EaObject {
  packageId: number;
  parentId: number;
}
