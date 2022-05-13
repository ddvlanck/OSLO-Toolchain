import { ComponentsManager } from 'componentsjs';
import type { GeneratorRunner } from '../lib/GeneratorRunner';

const run = async (): Promise<void> => {
  const manager = await ComponentsManager.build({
    mainModulePath: `${__dirname}/..`, // Path to your npm package's root
  });

  await manager.configRegistry.register('./config/config.jsonld');
  const runner: GeneratorRunner = await manager.instantiate('http://example.org/GeneratorRunner');

  await runner.start();
};

run().catch(error => console.log(error));
