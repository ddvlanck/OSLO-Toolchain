export enum ContributorType {
  Author,
  Contributor,
  Editor,
  Unknown
}

export interface Person {
  affiliation: string;
  affiliatonLink: string;
  firstName: string;
  lastName: string;
  email?: string;
  contributorType: ContributorType;
}
