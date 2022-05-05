import { readFile } from 'fs/promises';
import { Configuration } from '@oslo-flanders/ea-converter-configuration';
import { EaConverter } from '../lib/EaConverter';
import { JsonLdOutputHandler } from '../lib/JsonLdOutputHandler';
import { cleanUp } from './utils';

// TODO: make a test for vocabulary and one for application profile
describe('Associations with "uri" tags', () => {
  const configuration = new Configuration(
    // eslint-disable-next-line max-len
    'https://github.com/Informatievlaanderen/OSLOthema-toolchainTestbed/blob/master/testAssociatiesMijnDomeinMetUriTags.EAP?raw=true',
    'MijnDomeinMetUriTags',
    'uritags.report.test.jsonld',
    'ApplicationProfile',
  );

  const outputHandler = new JsonLdOutputHandler();

  afterEach(async () => {
    await cleanUp(configuration.outputFile);
  });

  it('should handle an EAP file containing elements with "uri" tags', async () => {
    const converter = new EaConverter(configuration, outputHandler);
    await converter.convert();

    const target = await readFile('test/outputFiles/AssociationsWithUriTags.report.jsonld');
    const source = await readFile(configuration.outputFile);

    expect(source).toEqual(target);
  });
});
