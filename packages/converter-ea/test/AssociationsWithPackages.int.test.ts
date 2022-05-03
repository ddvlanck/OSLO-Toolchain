import { readFile } from 'fs/promises';
import { Configuration } from '@oslo-flanders/ea-converter-configuration';
import { EaConverter } from '../lib/EaConverter';
import { JsonLdOutputHandler } from '../lib/JsonLdOutputHandler';
import { cleanUp } from './utils';

// TODO: make a test for vocabulary and one for application profile
describe('Associations with packages', () => {
  const configuration = new Configuration(
    // eslint-disable-next-line max-len
    'https://github.com/Informatievlaanderen/OSLOthema-toolchainTestbed/blob/master/testAssociatiesMijnDomeinMetPackages.EAP?raw=true',
    'MijnDomeinMetPackages',
    'packages.report.test.jsonld',
    'ApplicationProfile',
  );

  const outputHandler = new JsonLdOutputHandler();

  afterEach(async () => {
    await cleanUp(configuration.outputFile);
  });

  it('should handle an EAP file wiht multiple packages', async () => {
    const converter = new EaConverter(configuration, outputHandler);
    await converter.convert();

    const target = await readFile('test/outputFiles/AssociationsWithPackages.report.jsonld');
    const source = await readFile(configuration.outputFile);

    expect(source).toEqual(target);
  });
});
