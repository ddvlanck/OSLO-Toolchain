import type { Class } from '../oslo/Class';
import type { Package } from '../oslo/Package';
import type { Property } from '../oslo/Property';

export interface OutputHandler {
  addPackage: (_package: Package) => void;
  addClass: (_class: Class) => void;
  addAttribute: (attribute: Property) => void;
  write: () => Promise<void>;
}
