import {
  TOURNAMENT_MODES,
  WEEKDAY_TIME_SLOTS,
  WEEKEND_TIME_SLOTS,
  createTournamentDraft,
  generateRoundRobinRounds,
  getPairKey,
  normalizeTime,
  validateTournamentDraft,
} from './tournamentScheduler';

const teams = Array.from({ length: 8 }, (_, index) => ({
  id: `team-${index + 1}`,
  name: `Team ${index + 1}`,
}));

describe('eight-team tournament scheduling', () => {
  test('creates 28 unique fixtures and seven matches per team', () => {
    const fixtures = generateRoundRobinRounds(teams).flat();
    const teamCounts = Object.fromEntries(teams.map((team) => [team.id, 0]));
    const pairs = new Set();

    fixtures.forEach(({ team1, team2 }) => {
      teamCounts[team1.id] += 1;
      teamCounts[team2.id] += 1;
      pairs.add([team1.id, team2.id].sort().join('|'));
    });

    expect(fixtures).toHaveLength(28);
    expect(pairs.size).toBe(28);
    expect(Object.values(teamCounts)).toEqual(Array(8).fill(7));
  });

  test.each([
    [TOURNAMENT_MODES.WEEKDAY, [1, 2, 3, 4, 5]],
    [TOURNAMENT_MODES.SATURDAY, [6]],
    [TOURNAMENT_MODES.SUNDAY, [0]],
  ])('creates a valid %s schedule', (mode, allowedDays) => {
    const draft = createTournamentDraft({
      teams,
      mode,
      startDate: '2026-09-01',
      venue: 'Main Ground',
    });

    expect(draft).toHaveLength(28);
    expect(draft.every((fixture) => allowedDays.includes(new Date(`${fixture.scheduledDate}T00:00:00`).getDay()))).toBe(true);
    expect(validateTournamentDraft(draft, mode)).toBeNull();
  });

  test('uses only selected weekday time slots', () => {
    const draft = createTournamentDraft({
      teams,
      mode: TOURNAMENT_MODES.WEEKDAY,
      startDate: '2026-09-01',
      venue: 'Main Ground',
      timeSlots: [WEEKDAY_TIME_SLOTS[0]],
    });

    expect(new Set(draft.map((fixture) => fixture.time))).toEqual(new Set(['06:00']));
  });

  test('distributes weekend fixtures across three selected slots', () => {
    const selectedSlots = WEEKEND_TIME_SLOTS.slice(0, 3);
    const draft = createTournamentDraft({
      teams,
      mode: TOURNAMENT_MODES.SATURDAY,
      startDate: '2026-09-01',
      venue: 'Sports Complex',
      timeSlots: selectedSlots,
    });

    expect(new Set(draft.map((fixture) => fixture.time))).toEqual(new Set(selectedSlots));
    expect(validateTournamentDraft(draft, TOURNAMENT_MODES.SATURDAY)).toBeNull();
  });

  test('honors a team preferred time for every one of its fixtures', () => {
    const teamsWithPreference = teams.map((team, index) =>
      index === 0 ? { ...team, preferredTimeSlots: ['13:30'] } : team
    );
    const draft = createTournamentDraft({
      teams: teamsWithPreference,
      mode: TOURNAMENT_MODES.SATURDAY,
      startDate: '2026-09-01',
      venue: 'Sports Complex',
      timeSlots: WEEKEND_TIME_SLOTS,
    });

    expect(
      draft.filter((fixture) => [fixture.team1Id, fixture.team2Id].includes('team-1'))
        .every((fixture) => fixture.time === '13:30')
    ).toBe(true);
    expect(validateTournamentDraft(draft, TOURNAMENT_MODES.SATURDAY, teamsWithPreference)).toBeNull();
  });

  test('rejects teams whose preferred times do not overlap', () => {
    const teamsWithConflict = teams.map((team, index) => {
      if (index === 0) return { ...team, preferredTimeSlots: ['06:00'] };
      if (index === 1) return { ...team, preferredTimeSlots: ['16:30'] };
      return team;
    });

    expect(() => createTournamentDraft({
      teams: teamsWithConflict,
      mode: TOURNAMENT_MODES.SATURDAY,
      startDate: '2026-09-01',
      venue: 'Sports Complex',
      timeSlots: WEEKEND_TIME_SLOTS,
    })).toThrow(/do not share a preferred time/i);
  });

  test('rejects a manual time edit outside a team preference', () => {
    const teamsWithPreference = teams.map((team, index) =>
      index === 0 ? { ...team, preferredTimeSlots: ['06:00'] } : team
    );
    const draft = createTournamentDraft({
      teams: teamsWithPreference,
      mode: TOURNAMENT_MODES.SATURDAY,
      startDate: '2026-09-01',
      venue: 'Sports Complex',
      timeSlots: WEEKEND_TIME_SLOTS,
    });
    const preferredFixture = draft.find((fixture) =>
      [fixture.team1Id, fixture.team2Id].includes('team-1')
    );
    preferredFixture.time = '16:30';

    expect(validateTournamentDraft(draft, TOURNAMENT_MODES.SATURDAY, teamsWithPreference))
      .toMatch(/can only play/i);
  });

  test('gives every team its exact requested number of matches per time', () => {
    const slotQuotas = Object.fromEntries(teams.map((team) => [team.id, {
      '06:00': 2,
      '10:00': 2,
      '13:30': 1,
      '16:30': 1,
      '20:00': 1,
    }]));
    const draft = createTournamentDraft({
      teams,
      mode: TOURNAMENT_MODES.SATURDAY,
      startDate: '2026-09-01',
      venue: 'Sports Complex',
      timeSlots: WEEKEND_TIME_SLOTS,
      slotQuotas,
    });

    teams.forEach((team) => {
      const teamFixtures = draft.filter((fixture) =>
        fixture.team1Id === team.id || fixture.team2Id === team.id
      );
      WEEKEND_TIME_SLOTS.forEach((slot) => {
        expect(teamFixtures.filter((fixture) => fixture.time === slot))
          .toHaveLength(slotQuotas[team.id][slot]);
      });
    });
  });

  test('rejects slot counts that do not total the team remaining matches', () => {
    const slotQuotas = Object.fromEntries(teams.map((team) => [team.id, {
      '06:00': 2,
      '10:00': 2,
      '13:30': 2,
      '16:30': 1,
      '20:00': 1,
    }]));

    expect(() => createTournamentDraft({
      teams,
      mode: TOURNAMENT_MODES.SATURDAY,
      startDate: '2026-09-01',
      venue: 'Sports Complex',
      timeSlots: WEEKEND_TIME_SLOTS,
      slotQuotas,
    })).toThrow(/must total 7 remaining matches/i);
  });

  test('rejects a manual edit that breaks configured slot counts', () => {
    const slotQuotas = Object.fromEntries(teams.map((team) => [team.id, {
      '06:00': 2,
      '10:00': 2,
      '13:30': 1,
      '16:30': 1,
      '20:00': 1,
    }]));
    const draft = createTournamentDraft({
      teams,
      mode: TOURNAMENT_MODES.SATURDAY,
      startDate: '2026-09-01',
      venue: 'Sports Complex',
      timeSlots: WEEKEND_TIME_SLOTS,
      slotQuotas,
    });
    draft[0].time = draft[0].time === '06:00' ? '10:00' : '06:00';

    expect(validateTournamentDraft(draft, TOURNAMENT_MODES.SATURDAY, teams, slotQuotas))
      .toMatch(/requires .* match/i);
  });

  test('excludes pairings that were already played', () => {
    const excludedPairKeys = [
      getPairKey('team-1', 'team-2'),
      getPairKey('team-1', 'team-3'),
      getPairKey('team-4', 'team-8'),
    ];
    const draft = createTournamentDraft({
      teams,
      mode: TOURNAMENT_MODES.WEEKDAY,
      startDate: '2026-09-01',
      venue: 'Main Ground',
      excludedPairKeys,
    });
    const generatedPairs = new Set(
      draft.map((fixture) => getPairKey(fixture.team1Id, fixture.team2Id))
    );

    expect(draft).toHaveLength(25);
    excludedPairKeys.forEach((pairKey) => expect(generatedPairs.has(pairKey)).toBe(false));
    expect(validateTournamentDraft(draft, TOURNAMENT_MODES.WEEKDAY)).toBeNull();
  });

  test('rejects two matches for the same team on one day', () => {
    const draft = createTournamentDraft({
      teams,
      mode: TOURNAMENT_MODES.WEEKDAY,
      startDate: '2026-09-01',
      venue: 'Main Ground',
    });
    draft[4].scheduledDate = draft[0].scheduledDate;

    expect(validateTournamentDraft(draft, TOURNAMENT_MODES.WEEKDAY)).toMatch(/one match/i);
  });

  test.each([
    ['9:00', '09:00'],
    ['09:00', '09:00'],
    ['9:00 AM', '09:00'],
    ['4:30 PM', '16:30'],
    ['12:00 AM', '00:00'],
    ['12:00 PM', '12:00'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeTime(input)).toBe(expected);
  });
});

describe('ten-team tournament scheduling', () => {
  const tenTeams = Array.from({ length: 10 }, (_, index) => ({
    id: `ten-team-${index + 1}`,
    name: `Ten Team ${index + 1}`,
  }));

  test('creates 45 unique fixtures and nine matches per team', () => {
    const fixtures = generateRoundRobinRounds(tenTeams).flat();
    const teamCounts = Object.fromEntries(tenTeams.map((team) => [team.id, 0]));
    const pairs = new Set();

    fixtures.forEach(({ team1, team2 }) => {
      teamCounts[team1.id] += 1;
      teamCounts[team2.id] += 1;
      pairs.add(getPairKey(team1.id, team2.id));
    });

    expect(fixtures).toHaveLength(45);
    expect(pairs.size).toBe(45);
    expect(Object.values(teamCounts)).toEqual(Array(10).fill(9));
  });

  test('creates a valid 10-team Saturday schedule', () => {
    const draft = createTournamentDraft({
      teams: tenTeams,
      mode: TOURNAMENT_MODES.SATURDAY,
      startDate: '2026-09-01',
      venue: 'Main Ground',
      timeSlots: WEEKEND_TIME_SLOTS,
    });

    expect(draft).toHaveLength(45);
    expect(validateTournamentDraft(draft, TOURNAMENT_MODES.SATURDAY)).toBeNull();
  });
});
