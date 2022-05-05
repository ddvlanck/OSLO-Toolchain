import { readFile } from 'fs/promises';
import { Configuration } from '@oslo-flanders/ea-converter-configuration';
import { EaConverter } from '../lib/EaConverter';
import { JsonLdOutputHandler } from '../lib/JsonLdOutputHandler';
import { cleanUp } from './utils';

// TODO: make a test for vocabulary and one for application profile
describe('Associations with capital letters', () => {
  const configuration = new Configuration(
    // eslint-disable-next-line max-len
    'https://github.com/Informatievlaanderen/OSLOthema-toolchainTestbed/blob/master/testAssociatiesMijnDomeinMetHoofdletters.EAP?raw=true',
    'MijnDomeinMetHoofdletters',
    'capitals.report.test.jsonld',
    'ApplicationProfile',
  );

  const outputHandler = new JsonLdOutputHandler();

  afterEach(async () => {
    await cleanUp(configuration.outputFile);
  });

  it('should handle an EAP file containing elements starting with a capital', async () => {
    const converter = new EaConverter(configuration, outputHandler);
    await converter.convert();

    const target = await readFile('test/outputFiles/AssociationsWithCapitals.report.jsonld');
    const source = await readFile(configuration.outputFile);

    expect(source).toEqual(target);
  });
});
