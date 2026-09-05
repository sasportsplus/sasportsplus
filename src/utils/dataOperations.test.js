import {
  addTeamToList,
  addTeamsToList,
  updateTeamInList,
  removeTeamFromData,
  addMatchToList,
  updateMatchInList,
  removeMatchFromList,
  addTournamentToList,
  removeTournamentFromList,
  updateTournamentInList,
} from './dataOperations';

describe('local sports data operations', () => {
  test('adds and edits a team without mutating the previous list', () => {
    const original = [];
    const added = addTeamToList(original, { name: 'Falcons', players: 15 });
    const updated = updateTeamInList(added.teams, added.team.id, { players: 18 });

    expect(original).toEqual([]);
    expect(added.team.id).toBeTruthy();
    expect(updated[0]).toMatchObject({ name: 'Falcons', players: 18 });
  });

  test('adds multiple teams in one operation', () => {
    const original = [{ id: 'existing-team', name: 'Existing' }];
    const result = addTeamsToList(original, [
      { name: 'Eagles', players: 0 },
      { name: 'Tigers', players: 0 },
    ]);

    expect(original).toHaveLength(1);
    expect(result.createdTeams).toHaveLength(2);
    expect(result.teams.map((team) => team.name)).toEqual(['Existing', 'Eagles', 'Tigers']);
    expect(new Set(result.createdTeams.map((team) => team.id)).size).toBe(2);
  });

  test('schedules, edits, and deletes a match', () => {
    const added = addMatchToList([], {
      team1Id: 'team-1',
      team2Id: 'team-2',
      team1Name: 'Falcons',
      team2Name: 'Tigers',
    });
    const updated = updateMatchInList(added.matches, added.match.id, {
      status: 'Completed',
      team1Score: 2,
      team2Score: 1,
    });

    expect(updated[0]).toMatchObject({ status: 'Completed', team1Score: 2, team2Score: 1 });
    expect(removeMatchFromList(updated, added.match.id)).toEqual([]);
  });

  test('deleting a team also removes its matches', () => {
    const teams = [{ id: 'team-1' }, { id: 'team-2' }, { id: 'team-3' }];
    const matches = [
      { id: 'match-1', team1Id: 'team-1', team2Id: 'team-2' },
      { id: 'match-2', team1Id: 'team-2', team2Id: 'team-3' },
    ];
    const result = removeTeamFromData(teams, matches, 'team-1');

    expect(result.teams).toHaveLength(2);
    expect(result.matches).toEqual([matches[1]]);
  });

  test('repeated scheduling preserves every match', () => {
    let matches = [];
    for (let index = 0; index < 8; index += 1) {
      matches = addMatchToList(matches, {
        team1Id: `team-${index}`,
        team2Id: `team-${index + 1}`,
      }).matches;
    }

    expect(matches).toHaveLength(8);
    expect(new Set(matches.map((match) => match.id)).size).toBe(8);
  });

  test('creates multiple tournament pools and removes only the selected pool', () => {
    const first = addTournamentToList([], {
      name: 'Saturday League',
      poolSize: 8,
      teamIds: Array.from({ length: 8 }, (_, index) => `team-${index}`),
    });
    const second = addTournamentToList(first.tournaments, {
      name: 'Weekday League',
      poolSize: 10,
      teamIds: Array.from({ length: 10 }, (_, index) => `team-${index}`),
    });
    const remaining = removeTournamentFromList(second.tournaments, first.tournament.id);

    expect(second.tournaments).toHaveLength(2);
    expect(remaining).toEqual([second.tournament]);
  });

  test('updates tournament membership without changing its identity', () => {
    const original = addTournamentToList([], {
      name: 'Weekend League',
      poolSize: 8,
      teamIds: ['team-1', 'team-2', 'team-3'],
    });
    const updated = updateTournamentInList(
      original.tournaments,
      original.tournament.id,
      { teamIds: ['team-1', 'team-4'] }
    );

    expect(updated[0].id).toBe(original.tournament.id);
    expect(updated[0].teamIds).toEqual(['team-1', 'team-4']);
    expect(updated[0].updatedAt).toBeTruthy();
  });
});
