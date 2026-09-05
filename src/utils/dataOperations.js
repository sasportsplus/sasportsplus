export const createLocalId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const addTeamToList = (teams, teamData) => {
  const team = {
    id: createLocalId(),
    ...teamData,
    createdAt: new Date().toISOString(),
  };

  return { team, teams: [...teams, team] };
};

export const addTeamsToList = (teams, teamDataList) => {
  const createdTeams = teamDataList.map((teamData) => ({
    id: createLocalId(),
    ...teamData,
    createdAt: new Date().toISOString(),
  }));

  return { createdTeams, teams: [...teams, ...createdTeams] };
};

export const updateTeamInList = (teams, teamId, teamData) =>
  teams.map((team) =>
    team.id === teamId ? { ...team, ...teamData } : team
  );

export const removeTeamFromData = (teams, matches, teamId) => ({
  teams: teams.filter((team) => team.id !== teamId),
  matches: matches.filter(
    (match) => match.team1Id !== teamId && match.team2Id !== teamId
  ),
});

export const addMatchToList = (matches, matchData) => {
  const match = {
    id: createLocalId(),
    ...matchData,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  };

  return { match, matches: [...matches, match] };
};

export const addMatchesToList = (matches, matchDataList) => {
  const createdMatches = matchDataList.map((matchData) => ({
    id: createLocalId(),
    ...matchData,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  }));

  return {
    createdMatches,
    matches: [...matches, ...createdMatches],
  };
};

export const updateMatchInList = (matches, matchId, matchData) =>
  matches.map((match) =>
    match.id === matchId ? { ...match, ...matchData } : match
  );

export const removeMatchFromList = (matches, matchId) =>
  matches.filter((match) => match.id !== matchId);

export const addTournamentToList = (tournaments, tournamentData) => {
  const tournament = {
    id: createLocalId(),
    ...tournamentData,
    createdAt: new Date().toISOString(),
  };
  return { tournament, tournaments: [...tournaments, tournament] };
};

export const removeTournamentFromList = (tournaments, tournamentId) =>
  tournaments.filter((tournament) => tournament.id !== tournamentId);

export const updateTournamentInList = (tournaments, tournamentId, tournamentData) =>
  tournaments.map((tournament) =>
    tournament.id === tournamentId
      ? { ...tournament, ...tournamentData, updatedAt: new Date().toISOString() }
      : tournament
  );
