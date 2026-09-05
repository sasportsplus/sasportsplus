import { parseTeamNames } from '../utils/bulkTeamNames';

describe('bulk team name parsing', () => {
  test('accepts comma-separated and line-separated names', () => {
    expect(parseTeamNames('Eagles, Tigers\nPanthers')).toEqual([
      'Eagles',
      'Tigers',
      'Panthers',
    ]);
  });

  test('trims names and removes case-insensitive duplicates and invalid names', () => {
    expect(parseTeamNames(' Eagles, eagles, A, , Tigers ')).toEqual(['Eagles', 'Tigers']);
  });
});
