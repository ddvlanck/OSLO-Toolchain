import type { Converter } from './Converter';
import type { OutputHandler } from './OutputHandler';

/**
 * Interface that contains the configuration for the converters and/or generators
 * Implementor can choose to run part or all of the Toolchain
 */
export interface Runner<T> {
  configuration: T;
  converter: Converter<T>;
  converterOutputHandler: OutputHandler;
  generators: Generator[];
  start: () => Promise<void>;
  init: () => Promise<void>;
}
