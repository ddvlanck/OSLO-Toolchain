import { DataExtractor } from '@oslo-flanders/ea-data-extractor';
import type { Converter } from '@oslo-flanders/types';

export class EaConverter implements Converter {
  private readonly extractor: DataExtractor;

  public constructor(umlFile: string) {
    this.extractor = new DataExtractor(umlFile);
  }

  public convert(): any {
    console.log('HI');
  }
}
