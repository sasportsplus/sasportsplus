import { getNextTeamColor, getTeamColor, TEAM_COLOR_PALETTE } from './teamColors';

describe('team colors', () => {
  test('assigns a different color to each of eight teams', () => {
    const teams = [];
    for (let index = 0; index < 8; index += 1) {
      teams.push({ id: `team-${index}`, color: getNextTeamColor(teams) });
    }

    expect(new Set(teams.map((team) => team.color)).size).toBe(8);
  });

  test('keeps a stored team color stable', () => {
    const team = { id: 'team-1', color: TEAM_COLOR_PALETTE[5] };
    expect(getTeamColor(team, [team])).toBe(TEAM_COLOR_PALETTE[5]);
  });
});
