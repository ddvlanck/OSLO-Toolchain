import type { OutputHandler } from '@oslo-flanders/core';
import type { EaDocument } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import type { UriAssigner } from '../UriAssigner';
import { ignore } from '../utils/utils';

export class PackageConverterHandler extends ConverterHandler {
  public documentNotification(document: EaDocument): void {
    this.objects = document.eaPackages.filter(x => !ignore(x, false));
  }

  public convertToOslo(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const ontologyUriMap = uriAssigner.packageIdOntologyUriMap;
    const baseUriMap = uriAssigner.packageIdUriMap;

    this.objects.forEach(_package => {
      const ontologyUri = ontologyUriMap.get(_package.packageId)!;
      const baseUri = baseUriMap.get(_package.packageId)!;

      const osloPackage = {
        name: _package.name,
        baseUri,
        ontologyUri,
      };

      outputHandler.addPackage(osloPackage);
    });
  }
}
