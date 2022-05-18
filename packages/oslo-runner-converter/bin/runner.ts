import type { EaConverterConfiguration } from '@oslo-flanders/configuration';
import { transformToEaConverterConfiguration } from '../lib/EaConverterConfigurationTransformer';
import { OsloConverterRunner } from '../lib/OsloConverterRunner';

const run = async (): Promise<void> => {
  const config: EaConverterConfiguration = await transformToEaConverterConfiguration('./config/config.json');
  const runner: OsloConverterRunner = new OsloConverterRunner(config);

  runner.logger.info(`Start initialization.`);
  await runner.init();

  runner.logger.info(`Starting conversion.`);
  await runner.start();
};

run().catch(error => console.log(error));
