import type { OutputHandler, Package } from '@oslo-flanders/core';
import type { EaPackage } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import type { UriAssigner } from '../UriAssigner';

export class PackageConverterHandler extends ConverterHandler<EaPackage> {
  public createOsloObject(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const ontologyUriMap = uriAssigner.packageIdOntologyUriMap;
    const baseUriMap = uriAssigner.packageIdUriMap;

    this.converter.getPackages().forEach(_package => {
      const ontologyUri = ontologyUriMap.get(_package.packageId)!;
      const baseUri = baseUriMap.get(_package.packageId)!;

      const osloPackage: Package = {
        name: _package.name,
        baseUri: new URL(baseUri),
        ontologyUri: new URL(ontologyUri),
      };

      outputHandler.addPackage(osloPackage);
    });
  }
}
