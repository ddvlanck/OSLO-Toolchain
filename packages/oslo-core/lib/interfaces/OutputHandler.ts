import type { Class } from '../oslo/Class';
import type { DataType } from '../oslo/DataType';
import type { Package } from '../oslo/Package';
import type { Property } from '../oslo/Property';

export interface OutputHandler {
  addPackage: (_package: Package) => void;
  addClass: (_class: Class) => void;
  addAttribute: (attribute: Property) => void;
  addDataType: (datatype: DataType) => void;
  addStakeholders: (stakeholdersFile: string) => Promise<void>;
  write: (path: string) => Promise<void>;
}
