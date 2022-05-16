import type { EaConverterConfiguration } from '@oslo-flanders/configuration';
import { transformToEaConverterConfiguration } from '../lib/EaConverterConfigurationTransformer';
import { OsloConverterRunner } from '../lib/OsloConverterRunner';

const run = async (): Promise<void> => {
  const config: EaConverterConfiguration = await transformToEaConverterConfiguration('./config/config.json');
  const runner: OsloConverterRunner = new OsloConverterRunner(config);

  await runner.init();
  await runner.start();
};

run().catch(error => console.log(error));
