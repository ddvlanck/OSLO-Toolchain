import type { Generator } from '@oslo-flanders/core';

export class RdfGenerator implements Generator {
  public async generate(data: any): Promise<void> {
    console.log(`This method will be used to generate an RDF vocabulary file`);
  }
}
