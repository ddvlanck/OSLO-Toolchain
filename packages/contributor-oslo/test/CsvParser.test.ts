import type { Person } from '@oslo-flanders/types';
import { ContributorType } from '@oslo-flanders/types';
import { CsvParser } from '../lib/CsvParser';

describe('CsvParser', (): void => {
  let parser: CsvParser;

  beforeEach(async (): Promise<void> => {
    parser = new (<any>CsvParser)();
    (<any>parser).logger.warn = jest.fn();
  });

  it('should have default delimiter set to ";"', async () => {
    expect(parser.delimiter).toEqual(';');
  });

  it('should allow users to set a new delimiter', async () => {
    parser.delimiter = ',';

    expect(parser.delimiter).toEqual(',');
  });

  it('should allow to retrieve the contributors', async () => {
    expect(parser.contributors).toEqual([]);
  });

  it('should parse a .csv file and map to the "Person" type', async () => {
    await parser.parseCsv('test/files/test-01.csv');

    const result: Person[] = [
      {
        firstName: 'AuteurVoornaam',
        lastName: 'AuteurNaam',
        affiliation: 'AuteurAffiliatie',
        affiliatonLink: 'https://auteurwebsiteurl',
        email: 'auteurvoornaam.auteurnaam@auteurdomein',
        contributorType: ContributorType.Author,
      },
      {
        firstName: 'EditorVoornaam',
        lastName: 'EditorNaam',
        affiliation: 'EditorAffiliatie',
        affiliatonLink: 'https://editorwebsiteurl',
        email: 'editorvoornaam.editornaam@editordomein',
        contributorType: ContributorType.Editor,
      },
      {
        firstName: 'ContributorVoornaam',
        lastName: 'ContributorNaam',
        affiliation: 'ContributorAffiliatie',
        affiliatonLink: 'https://contributorwebsiteurl',
        email: 'contributorvoornaam.contributornaam@contributordomein',
        contributorType: ContributorType.Contributor,
      },
    ];

    result.forEach(person => {
      expect(parser.contributors).toContainEqual(person);
    });
  });

  it('should log a warning when contributor type could not be mapped', async () => {
    await parser.parseCsv('test/files/test-02.csv');

    expect((<any>parser).logger.warn).toHaveBeenCalledTimes(1);
  });

  it('should set contributor type to unknown when not present or not able to be mapped', async () => {
    await parser.parseCsv('test/files/test-03.csv');

    const result: Person[] = [
      {
        firstName: 'AuteurVoornaam',
        lastName: 'AuteurNaam',
        affiliation: 'AuteurAffiliatie',
        affiliatonLink: 'https://auteurwebsiteurl',
        email: 'auteurvoornaam.auteurnaam@auteurdomein',
        contributorType: ContributorType.Unknown,
      },
      {
        firstName: 'AuteurVoornaam',
        lastName: 'AuteurNaam',
        affiliation: 'AuteurAffiliatie',
        affiliatonLink: 'https://auteurwebsiteurl',
        email: 'auteurvoornaam.auteurnaam@auteurdomein',
        contributorType: ContributorType.Unknown,
      },
    ];

    result.forEach(person => {
      expect(person.contributorType).toEqual(ContributorType.Unknown);
    });
  });
});
