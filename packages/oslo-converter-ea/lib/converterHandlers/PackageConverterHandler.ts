import type { OutputHandler } from '@oslo-flanders/core';
import { ns } from '@oslo-flanders/core';
import type { EaPackage } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import type { UriAssigner } from '../UriAssigner';

export class PackageConverterHandler extends ConverterHandler<EaPackage> {
  public addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): void {
    const ontologyUriMap = uriAssigner.packageIdOntologyUriMap;
    const baseUriMap = uriAssigner.packageIdUriMap;

    // Only package from target diagram is added
    const targetPackage = this.converter.getPackages()
      .find(x => x.packageId === this.converter.getTargetDiagram().packageId)!;

    const ontologyUri = ontologyUriMap.get(targetPackage.packageId)!;
    const ontologyNamedNode = this.factory.namedNode(ontologyUri);

    outputHandler.add(ontologyNamedNode, ns.rdf('type'), ns.example('Package'));

    const baseUri = baseUriMap.get(targetPackage.packageId)!;
    const baseUriNamedNode = this.factory.namedNode(baseUri);

    outputHandler.add(ontologyNamedNode, ns.example('baseUri'), baseUriNamedNode);
  }
}
