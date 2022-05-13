import { ComponentsManager } from 'componentsjs';
import type { OsloConverterRunner } from '../lib/OsloConverterRunner';

const run = async <T>(): Promise<void> => {
  const manager = await ComponentsManager.build({
    // Path to your npm package's root
    mainModulePath: `${__dirname}/..`,
  });

  await manager.configRegistry.register('./config/config.jsonld');
  const runner: OsloConverterRunner<T> = await manager.instantiate('http://example.org/OsloConverterRunner');

  await runner.start();
};

run().catch(error => console.log(error));
