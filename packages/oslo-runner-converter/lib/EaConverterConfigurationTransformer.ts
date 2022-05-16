import { EaConverterConfiguration } from '@oslo-flanders/configuration';
import { fetchFileOrUrl } from '@oslo-flanders/core';

export async function transformToEaConverterConfiguration(config: string): Promise<EaConverterConfiguration> {
  const buffer = await fetchFileOrUrl(config);
  const data = JSON.parse(buffer.toString());

  return new EaConverterConfiguration(
    data.umlFile,
    data.diagramName,
    data.outputFile,
    data.specificationType,
    data.targetDomain,
  );
}
