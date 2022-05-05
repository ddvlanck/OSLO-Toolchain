import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

export async function cleanUp(outputFile: string): Promise<void> {
  const tasks = [];
  // FIXME: throws error
  /*if (existsSync(outputFile)) {
    tasks.push(unlink('toolchain-debug-info.log'));
  }*/

  tasks.push(unlink(outputFile));

  await Promise.all(tasks);
}
