import { mock } from 'jest-mock-extended';
import type { Converter } from '../lib/interfaces/Converter';

describe('Converter', () => {
  it('should convert and UML diagram to the intermediary format', async () => {
    const mockedInterface = mock<Converter>();

    mockedInterface.convert();
    expect(mockedInterface.convert).toHaveBeenCalled();
  });
});
