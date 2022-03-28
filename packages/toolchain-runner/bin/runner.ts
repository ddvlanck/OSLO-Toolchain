import { ComponentsManager } from 'componentsjs';
import type { ToolchainRunner } from '../lib/ToolchainRunner';

const run = async (): Promise<void> => {
  const manager = await ComponentsManager.build({
    mainModulePath: `${__dirname}/..`, // Path to your npm package's root
  });

  await manager.configRegistry.register('./config/config.jsonld');
  const runner: ToolchainRunner = await manager.instantiate('http://example.org/ToolchainRunner');

  await runner.start();
};

run().catch(error => console.log(error));
