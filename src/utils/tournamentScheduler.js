export const TOURNAMENT_MODES = {
  WEEKDAY: 'Weekday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

export const WEEKDAY_TIME_SLOTS = ['06:00', '20:00'];
export const WEEKEND_TIME_SLOTS = ['06:00', '10:00', '13:30', '16:30', '20:00'];
export const ALL_TIME_SLOTS = WEEKEND_TIME_SLOTS;

const pad = (value) => String(value).padStart(2, '0');

export const formatTimeLabel = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${pad(minutes)} ${suffix}`;
};

export const formatLocalDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseLocalDate = (dateValue) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatLocalDate(date) === dateValue ? date : null;
};

export const getPairKey = (team1Id, team2Id) =>
  [team1Id, team2Id].sort().join('|');

export const normalizeTime = (timeValue) => {
  const match = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)?$/i.exec(String(timeValue).trim());
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    if (meridiem === 'PM' && hour !== 12) hour += 12;
  } else if (hour > 23) {
    return null;
  }

  return `${pad(hour)}:${minute}`;
};

const moveToAllowedStartDate = (startDate, mode) => {
  const date = new Date(startDate);
  date.setHours(0, 0, 0, 0);

  if (mode === TOURNAMENT_MODES.SATURDAY) {
    date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7));
  } else if (mode === TOURNAMENT_MODES.SUNDAY) {
    date.setDate(date.getDate() + ((7 - date.getDay()) % 7));
  } else {
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
  }

  return date;
};

const getNextRoundDate = (date, mode) => {
  const next = new Date(date);
  if (mode === TOURNAMENT_MODES.WEEKDAY) {
    do {
      next.setDate(next.getDate() + 1);
    } while (next.getDay() === 0 || next.getDay() === 6);
  } else {
    next.setDate(next.getDate() + 7);
  }
  return next;
};

export const generateRoundRobinRounds = (teams) => {
  if (![8, 10].includes(teams.length)) {
    throw new Error('Exactly 8 or 10 teams are required');
  }

  const rotatingTeams = [...teams];
  const rounds = [];
  const teamCount = rotatingTeams.length;
  const matchesPerRound = teamCount / 2;

  for (let roundIndex = 0; roundIndex < teamCount - 1; roundIndex += 1) {
    const fixtures = [];
    for (let index = 0; index < matchesPerRound; index += 1) {
      fixtures.push({
        team1: rotatingTeams[index],
        team2: rotatingTeams[teamCount - 1 - index],
      });
    }
    rounds.push(fixtures);
    rotatingTeams.splice(1, 0, rotatingTeams.pop());
  }

  return rounds;
};

const assignQuotaSlots = (fixtures, teams, selectedTimeSlots, slotQuotas) => {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const remaining = Object.fromEntries(teams.map((team) => [
    team.id,
    Object.fromEntries(selectedTimeSlots.map((slot) => [
      slot,
      Number(slotQuotas?.[team.id]?.[slot] || 0),
    ])),
  ]));
  const requiredMatches = Object.fromEntries(teams.map((team) => [team.id, 0]));
  fixtures.forEach((fixture) => {
    requiredMatches[fixture.team1Id] += 1;
    requiredMatches[fixture.team2Id] += 1;
  });

  for (const team of teams) {
    const quotaTotal = selectedTimeSlots.reduce((total, slot) => total + remaining[team.id][slot], 0);
    if (quotaTotal !== requiredMatches[team.id]) {
      throw new Error(
        `${team.name}'s slot counts must total ${requiredMatches[team.id]} remaining matches (currently ${quotaTotal}).`
      );
    }
    for (const slot of selectedTimeSlots) {
      if (!Number.isInteger(remaining[team.id][slot]) || remaining[team.id][slot] < 0) {
        throw new Error(`${team.name} has an invalid match count for ${formatTimeLabel(slot)}.`);
      }
      if (team.preferredTimeSlots?.length
        && !team.preferredTimeSlots.includes(slot)
        && remaining[team.id][slot] > 0) {
        throw new Error(`${team.name} does not allow ${formatTimeLabel(slot)}.`);
      }
    }
  }

  for (const slot of selectedTimeSlots) {
    const total = teams.reduce((sum, team) => sum + remaining[team.id][slot], 0);
    if (total % 2 !== 0) {
      throw new Error(`The total team match count for ${formatTimeLabel(slot)} must be even.`);
    }
  }

  const assignments = Array(fixtures.length).fill(null);
  const unassigned = new Set(fixtures.map((_, index) => index));

  const availableSlots = (fixture) => selectedTimeSlots.filter((slot) =>
    remaining[fixture.team1Id][slot] > 0 && remaining[fixture.team2Id][slot] > 0
  );

  const quotasRemainPossible = () => teams.every((team) => selectedTimeSlots.every((slot) => {
    if (remaining[team.id][slot] === 0) return true;
    let possibleOpponents = 0;
    for (const index of unassigned) {
      const fixture = fixtures[index];
      if (fixture.team1Id !== team.id && fixture.team2Id !== team.id) continue;
      const opponentId = fixture.team1Id === team.id ? fixture.team2Id : fixture.team1Id;
      if (remaining[opponentId][slot] > 0) possibleOpponents += 1;
    }
    return remaining[team.id][slot] <= possibleOpponents;
  }));

  const search = () => {
    if (unassigned.size === 0) return true;
    let chosenIndex = null;
    let choices = null;
    for (const index of unassigned) {
      const currentChoices = availableSlots(fixtures[index]);
      if (currentChoices.length === 0) return false;
      if (!choices || currentChoices.length < choices.length) {
        chosenIndex = index;
        choices = currentChoices;
      }
    }
    choices.sort((slotA, slotB) => {
      const fixture = fixtures[chosenIndex];
      return (remaining[fixture.team1Id][slotA] + remaining[fixture.team2Id][slotA])
        - (remaining[fixture.team1Id][slotB] + remaining[fixture.team2Id][slotB]);
    });

    const fixture = fixtures[chosenIndex];
    unassigned.delete(chosenIndex);
    for (const slot of choices) {
      remaining[fixture.team1Id][slot] -= 1;
      remaining[fixture.team2Id][slot] -= 1;
      assignments[chosenIndex] = slot;
      if (quotasRemainPossible() && search()) return true;
      remaining[fixture.team1Id][slot] += 1;
      remaining[fixture.team2Id][slot] += 1;
    }
    assignments[chosenIndex] = null;
    unassigned.add(chosenIndex);
    return false;
  };

  if (!search()) {
    throw new Error('These team slot counts cannot produce a complete schedule. Adjust one or more team counts.');
  }
  return assignments;
};

export const createTournamentDraft = ({
  teams,
  mode,
  startDate,
  venue,
  timeSlots,
  excludedPairKeys = [],
  slotQuotas,
}) => {
  const parsedStartDate = parseLocalDate(startDate);
  if (!parsedStartDate) throw new Error('Start date must use YYYY-MM-DD format');

  const rounds = generateRoundRobinRounds(teams);
  const selectedTimeSlots = timeSlots?.length
    ? timeSlots
    : mode === TOURNAMENT_MODES.WEEKDAY
      ? WEEKDAY_TIME_SLOTS
      : WEEKEND_TIME_SLOTS;
  const excludedPairs = new Set(excludedPairKeys);
  let roundDate = moveToAllowedStartDate(parsedStartDate, mode);

  const getAllowedFixtureSlots = (team1, team2) => {
    const team1Slots = team1.preferredTimeSlots?.length
      ? new Set(team1.preferredTimeSlots)
      : null;
    const team2Slots = team2.preferredTimeSlots?.length
      ? new Set(team2.preferredTimeSlots)
      : null;
    const allowedSlots = selectedTimeSlots.filter((slot) =>
      (!team1Slots || team1Slots.has(slot)) && (!team2Slots || team2Slots.has(slot))
    );

    if (allowedSlots.length === 0) {
      throw new Error(
        `${team1.name} and ${team2.name} do not share a preferred time among the selected tournament slots.`
      );
    }
    return allowedSlots;
  };

  const draft = rounds.flatMap((fixtures, roundIndex) => {
    const scheduledDate = formatLocalDate(roundDate);
    const roundMatches = fixtures
      .filter(({ team1, team2 }) => !excludedPairs.has(getPairKey(team1.id, team2.id)))
      .map(({ team1, team2 }, matchIndex) => {
        const allowedSlots = getAllowedFixtureSlots(team1, team2);
        return {
          draftId: `round-${roundIndex + 1}-match-${matchIndex + 1}`,
          round: roundIndex + 1,
          team1Id: team1.id,
          team2Id: team2.id,
          team1Name: team1.name,
          team2Name: team2.name,
          scheduledDate,
          time: allowedSlots[matchIndex % allowedSlots.length],
          venue,
        };
      });
    roundDate = getNextRoundDate(roundDate, mode);
    return roundMatches;
  });

  if (slotQuotas) {
    const assignments = assignQuotaSlots(draft, teams, selectedTimeSlots, slotQuotas);
    return draft.map((fixture, index) => ({ ...fixture, time: assignments[index] }));
  }
  return draft;
};

export const validateTournamentDraft = (fixtures, mode, teams = [], slotQuotas = null) => {
  if (fixtures.length === 0) return 'There are no remaining matches to schedule.';
  if (fixtures.length > 45) return 'A tournament cannot contain more than 45 matches.';

  const teamDates = new Set();
  const pairings = new Set();
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const actualSlotCounts = {};

  for (const fixture of fixtures) {
    const pairKey = getPairKey(fixture.team1Id, fixture.team2Id);
    if (pairings.has(pairKey)) return 'The draft contains a duplicate team pairing.';
    pairings.add(pairKey);
    const date = parseLocalDate(fixture.scheduledDate);
    if (!date) return `Invalid date for ${fixture.team1Name} vs ${fixture.team2Name}.`;
    const normalizedTime = normalizeTime(fixture.time);
    if (!normalizedTime) {
      return `Invalid time for ${fixture.team1Name} vs ${fixture.team2Name}. Use 9:00, 09:00, or 9:00 AM format.`;
    }
    for (const teamId of [fixture.team1Id, fixture.team2Id]) {
      const team = teamsById.get(teamId);
      if (team?.preferredTimeSlots?.length && !team.preferredTimeSlots.includes(normalizedTime)) {
        return `${team.name} can only play at ${team.preferredTimeSlots.map(formatTimeLabel).join(' or ')}.`;
      }
      if (slotQuotas?.[teamId]) {
        actualSlotCounts[teamId] ||= {};
        actualSlotCounts[teamId][normalizedTime] = (actualSlotCounts[teamId][normalizedTime] || 0) + 1;
      }
    }
    if (!fixture.venue.trim()) return 'Every match requires a venue.';

    const day = date.getDay();
    if (mode === TOURNAMENT_MODES.WEEKDAY && (day === 0 || day === 6)) {
      return 'Weekday tournament matches must be Monday through Friday.';
    }
    if (mode === TOURNAMENT_MODES.SATURDAY && day !== 6) {
      return 'Saturday tournament matches must be played on Saturday.';
    }
    if (mode === TOURNAMENT_MODES.SUNDAY && day !== 0) {
      return 'Sunday tournament matches must be played on Sunday.';
    }

    for (const teamId of [fixture.team1Id, fixture.team2Id]) {
      const teamDateKey = `${teamId}|${fixture.scheduledDate}`;
      if (teamDates.has(teamDateKey)) {
        return 'A team cannot play more than one match on the same day.';
      }
      teamDates.add(teamDateKey);
    }

  }

  if (slotQuotas) {
    for (const team of teams) {
      for (const [slot, requiredCount] of Object.entries(slotQuotas[team.id] || {})) {
        const actualCount = actualSlotCounts[team.id]?.[slot] || 0;
        if (actualCount !== Number(requiredCount)) {
          return `${team.name} requires ${requiredCount} match(es) at ${formatTimeLabel(slot)}, but the draft has ${actualCount}.`;
        }
      }
    }
  }

  return null;
};
