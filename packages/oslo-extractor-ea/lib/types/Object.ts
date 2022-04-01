import type { Tag } from './Tag';

/**
 * General object that contains properties every object in an
 * Enterprise Architect file has
 */
export interface EaObject {
  id: number;
  guid: string;
  name?: string;
  tags?: Tag[];
}
