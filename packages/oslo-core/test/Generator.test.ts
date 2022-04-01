import { mock } from 'jest-mock-extended';
import type { Generator } from '../lib/Generator';

describe('Generator', () => {
  it('should generate an artifact', async () => {
    const mockedInterface = mock<Generator>();

    mockedInterface.generate({ data: 1 });
    expect(mockedInterface.generate).toHaveBeenCalledWith({ data: 1 });
  });
});
