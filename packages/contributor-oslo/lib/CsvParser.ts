import type { Person } from '@oslo-flanders/types';
import { ContributorType, getLoggerFor, fetchFileOrUrl } from '@oslo-flanders/types';
import type { Parser } from 'csv-parse';
import { parse } from 'csv-parse';

/**
 * Parses an OSLO Stakeholder file and maps the records to Person type
 */
export class CsvParser {
  private readonly logger = getLoggerFor(this);

  private readonly parser: Parser;
  private readonly _contributors: Person[];

  private _delimiter = ';';
  private readonly columnNames = ['Voornaam', 'Naam', 'Affiliatie', 'E-mail', 'Website'];

  public constructor() {
    this.parser = parse({ delimiter: this.delimiter, columns: true });
    this._contributors = [];
  }

  public get delimiter(): string {
    return this._delimiter;
  }

  public set delimiter(value: string) {
    this._delimiter = value;
  }

  public get contributors(): Person[] {
    return this._contributors;
  }

  public async parseCsv(file: string): Promise<void> {
    const data: Buffer = await fetchFileOrUrl(file);
    this.attachConsumerToStream();

    this.parser.write(data);
    this.parser.end();
  }

  private attachConsumerToStream(): void {
    this.parser.on('readable', () => {
      let record: any = this.parser.read();

      while (record) {
        this.onContributor(record);
        record = this.parser.read();
      }
    });

    this.parser.on('error', (error: unknown) => {
      this.logger.warn(`Something went wrong while parsing stakeholders file:\n${error}`);
    });
  }

  private onContributor(record: any): void {
    // Find the column name specifiying the contributor type.
    // This is different for each data standard (and stakeholder file)
    // If the array of column names does not include the key, we assume it
    // is the column name specifiying the contributor type
    let contributorType = ContributorType.Unknown;
    Object.keys(record).forEach(key => {
      if (key !== '' && !this.columnNames.includes(key)) {
        contributorType = this.getContributorType(record[key]);
      }
    });

    this._contributors.push({
      firstName: record.Voornaam,
      lastName: record.Naam,
      affiliation: record.Affiliatie,
      affiliatonLink: record.Website,
      email: record['E-mail'],
      contributorType,
    });
  }

  private getContributorType(value: string): ContributorType {
    switch (value) {
      case 'A':
        return ContributorType.Author;

      case 'C':
        return ContributorType.Contributor;

      case 'E':
        return ContributorType.Editor;

      default:
        this.logger.warn(`The value '${value}' could not be mapped to a contributor type.`);
        return ContributorType.Unknown;
    }
  }
}
