/**
 * Represents an attribute in Enterprise Architect
 */
export interface EaAttribute {
  id: number;
  name: string;
  classId: number;
  type: string;
  lowerBound: string;
  upperBound: string;
  guid: string;
}
