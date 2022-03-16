import type { Tag } from './Tag';

export interface EaElement {
  id: number;
  name?: string;
  tags?: Tag[];
}
