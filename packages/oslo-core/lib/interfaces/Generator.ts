export interface Generator {
  generate: (data: any) => Promise<void>;
}
