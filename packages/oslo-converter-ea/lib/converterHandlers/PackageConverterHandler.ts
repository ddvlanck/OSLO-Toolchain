import type { OutputHandler } from '@oslo-flanders/core';
import { ns } from '@oslo-flanders/core';
import type { EaPackage } from '@oslo-flanders/ea-extractor';
import { ConverterHandler } from '../types/ConverterHandler';
import type { UriAssigner } from '../UriAssigner';

// See comment in attribute handler about strategy

export class PackageConverterHandler extends ConverterHandler<EaPackage> {
  public async addObjectsToOutput(uriAssigner: UriAssigner, outputHandler: OutputHandler): Promise<void> {
    const ontologyUriMap = uriAssigner.packageIdOntologyUriMap;
    const baseUriMap = uriAssigner.packageIdUriMap;

    // Only package from target diagram is added
    const targetPackage = this.converter.getPackages()
      .find(x => x.packageId === this.converter.getTargetDiagram().packageId)!;

    const ontologyUri = ontologyUriMap.get(targetPackage.packageId)!;
    const ontologyNamedNode = this.factory.namedNode(ontologyUri);

    // Publish a unique reference of this attribute
    const uniqueInternalIdNamedNode = ns.example(`.well-known/${targetPackage.internalGuid}`);
    outputHandler.add(uniqueInternalIdNamedNode, ns.example('guid'), ontologyNamedNode);

    outputHandler.add(uniqueInternalIdNamedNode, ns.rdf('type'), ns.example('Package'));

    const baseUri = baseUriMap.get(targetPackage.packageId)!;
    const baseUriNamedNode = this.factory.namedNode(baseUri);

    outputHandler.add(uniqueInternalIdNamedNode, ns.example('baseUri'), baseUriNamedNode);
  }
}
