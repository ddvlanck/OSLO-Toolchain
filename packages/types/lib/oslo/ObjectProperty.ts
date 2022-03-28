import type { Class } from './Class';
import type { Property } from './Property';

export interface ObjectProperty extends Property {
  codelist: string;
  range: Class;
}
