import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createLocalId,
  addTeamToList,
  addTeamsToList,
  updateTeamInList,
  removeTeamFromData,
  addMatchToList,
  addMatchesToList,
  updateMatchInList,
  removeMatchFromList,
  addTournamentToList,
  removeTournamentFromList,
  updateTournamentInList,
} from '../utils/dataOperations';
import { TEAM_COLOR_PALETTE, getNextTeamColor } from '../utils/teamColors';

const SportsDataContext = createContext();
const APP_DATA_KEY = 'sanjaySportsDataV1';

const parseStoredArray = (value) => {
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Stored sports data is invalid.');
  return parsed;
};

const parseSnapshot = (value) => {
  if (!value) return null;
  try {
    const snapshot = JSON.parse(value);
    return Array.isArray(snapshot?.teams) && Array.isArray(snapshot?.matches)
      ? snapshot
      : null;
  } catch (error) {
    console.warn('Ignoring invalid local data snapshot:', error);
    return null;
  }
};

const SAMPLE_TEAMS = [
  { name: 'Thunder Strikers', captain: 'Arjun Mehta', players: 18, description: 'Fast, attacking school squad.' },
  { name: 'Royal Challengers', captain: 'Priya Sharma', players: 20, description: 'Balanced team with strong fielding.' },
  { name: 'Blue Warriors', captain: 'Vikram Singh', players: 17, description: 'Disciplined defensive unit.' },
  { name: 'Golden Eagles', captain: 'Neha Kapoor', players: 19, description: 'Energetic team focused on teamwork.' },
  { name: 'Mighty Panthers', captain: 'Rahul Nair', players: 18, description: 'Quick and competitive young athletes.' },
  { name: 'Red Dragons', captain: 'Anita Rao', players: 21, description: 'Experienced tournament contenders.' },
  { name: 'Green Titans', captain: 'Suresh Iyer', players: 16, description: 'Developing squad with strong potential.' },
  { name: 'Silver Hawks', captain: 'Kavita Joshi', players: 20, description: 'Agile team with excellent coordination.' },
];

const ensureSampleTeams = (existingTeams) => {
  const result = [...existingTeams];

  for (const sample of SAMPLE_TEAMS) {
    if (result.length >= 8) break;
    if (result.some((team) => team.name === sample.name)) continue;

    result.push({
      id: createLocalId(),
      ...sample,
      color: getNextTeamColor(result),
      createdAt: new Date().toISOString(),
    });
  }

  return result;
};

const createSampleMatches = (availableTeams) => {
  const venues = ['Main Sports Ground', 'School Stadium', 'Central Field', 'North Campus Arena'];
  const times = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];

  return availableTeams.slice(0, 8).map((team, index, teamsToSchedule) => {
    const opponent = teamsToSchedule[(index + 1) % teamsToSchedule.length];
    const matchDate = new Date();
    matchDate.setDate(matchDate.getDate() + index + 1);
    matchDate.setHours(9 + (index % 4) * 2, 0, 0, 0);

    return {
      id: createLocalId(),
      tournamentName: 'Sanjay School Sports League',
      team1Id: team.id,
      team2Id: opponent.id,
      team1Name: team.name,
      team2Name: opponent.name,
      date: matchDate.toISOString(),
      time: times[index % times.length],
      venue: venues[index % venues.length],
      status: 'Scheduled',
      team1Score: 0,
      team2Score: 0,
      createdAt: new Date().toISOString(),
    };
  });
};

export const SportsDataProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const teamsRef = useRef([]);
  const matchesRef = useRef([]);
  const tournamentsRef = useRef([]);

  const saveSnapshot = async (teamsData, matchesData, tournamentsData = tournamentsRef.current) => {
    const snapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      teams: teamsData,
      matches: matchesData,
      tournaments: tournamentsData,
    };
    const serialized = JSON.stringify(snapshot);
    await AsyncStorage.setItem(APP_DATA_KEY, serialized);

    const savedValue = await AsyncStorage.getItem(APP_DATA_KEY);
    if (savedValue !== serialized) {
      throw new Error('Local data could not be verified after saving.');
    }
  };

  // Load data from AsyncStorage on app start
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const snapshotData = await AsyncStorage.getItem(APP_DATA_KEY);
      const snapshot = parseSnapshot(snapshotData);
      const teamsData = snapshot?.teams
        ? JSON.stringify(snapshot.teams)
        : await AsyncStorage.getItem('teams');
      const matchesData = snapshot?.matches
        ? JSON.stringify(snapshot.matches)
        : await AsyncStorage.getItem('matches');
      const tournamentsData = Array.isArray(snapshot?.tournaments)
        ? JSON.stringify(snapshot.tournaments)
        : await AsyncStorage.getItem('tournaments');
      const demoDataSeeded = await AsyncStorage.getItem('demoDataSeeded');
      const storedTeams = parseStoredArray(teamsData).map((team, index) => {
        const migratedTeam = team.captain || !team.coach
          ? team
          : { ...team, captain: team.coach };
        const { coach, ...teamWithoutCoach } = migratedTeam;
        return {
          ...teamWithoutCoach,
          preferredTimeSlots: Array.isArray(teamWithoutCoach.preferredTimeSlots)
            ? teamWithoutCoach.preferredTimeSlots
            : [],
          color: teamWithoutCoach.color || TEAM_COLOR_PALETTE[index % TEAM_COLOR_PALETTE.length],
        };
      });
      const storedMatches = parseStoredArray(matchesData);
      const storedTournaments = parseStoredArray(tournamentsData);
      const shouldSeedDemoData = demoDataSeeded !== 'true';
      const seededTeams = shouldSeedDemoData
        ? ensureSampleTeams(storedTeams)
        : storedTeams;
      const seededMatches = shouldSeedDemoData && storedMatches.length === 0
        ? createSampleMatches(seededTeams)
        : storedMatches;

      setTeams(seededTeams);
      setMatches(seededMatches);
      setTournaments(storedTournaments);
      teamsRef.current = seededTeams;
      matchesRef.current = seededMatches;
      tournamentsRef.current = storedTournaments;
      await AsyncStorage.setItem('teams', JSON.stringify(seededTeams));
      await AsyncStorage.setItem('matches', JSON.stringify(seededMatches));
      await AsyncStorage.setItem('tournaments', JSON.stringify(storedTournaments));
      await saveSnapshot(seededTeams, seededMatches, storedTournaments);
      if (shouldSeedDemoData) {
        await AsyncStorage.setItem('demoDataSeeded', 'true');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTeamsToStorage = async (teamsData) => {
    try {
      await AsyncStorage.setItem('teams', JSON.stringify(teamsData));
      await saveSnapshot(teamsData, matchesRef.current);
    } catch (error) {
      console.error('Error saving teams:', error);
      throw error;
    }
  };

  const saveMatchesToStorage = async (matchesData) => {
    try {
      await AsyncStorage.setItem('matches', JSON.stringify(matchesData));
      await saveSnapshot(teamsRef.current, matchesData);
    } catch (error) {
      console.error('Error saving matches:', error);
      throw error;
    }
  };

  // Team Management Functions
  const addTeam = async (teamData) => {
    const { team: newTeam, teams: updatedTeams } = addTeamToList(teamsRef.current, {
      ...teamData,
      color: teamData.color || getNextTeamColor(teamsRef.current),
    });
    teamsRef.current = updatedTeams;
    setTeams(updatedTeams);
    await saveTeamsToStorage(updatedTeams);
    return newTeam;
  };

  const updateTeam = async (teamId, teamData) => {
    const updatedTeams = updateTeamInList(teamsRef.current, teamId, teamData);
    teamsRef.current = updatedTeams;
    setTeams(updatedTeams);
    await saveTeamsToStorage(updatedTeams);
  };

  const deleteTeam = async (teamId) => {
    const { teams: updatedTeams, matches: updatedMatches } = removeTeamFromData(
      teamsRef.current,
      matchesRef.current,
      teamId
    );
    teamsRef.current = updatedTeams;
    setTeams(updatedTeams);
    await saveTeamsToStorage(updatedTeams);

    // Remove matches associated with this team
    matchesRef.current = updatedMatches;
    setMatches(updatedMatches);
    await saveMatchesToStorage(updatedMatches);
  };

  const deleteAllTeams = async () => {
    teamsRef.current = [];
    matchesRef.current = [];
    tournamentsRef.current = [];
    setTeams([]);
    setMatches([]);
    setTournaments([]);

    await AsyncStorage.multiSet([
      ['teams', JSON.stringify([])],
      ['matches', JSON.stringify([])],
      ['tournaments', JSON.stringify([])],
    ]);
    await saveSnapshot([], [], []);
  };

  const getTeamById = (teamId) => {
    return teams.find((team) => team.id === teamId);
  };

  // Match Management Functions
  const scheduleMatch = async (matchData) => {
    const { match: newMatch, matches: updatedMatches } = addMatchToList(
      matchesRef.current,
      matchData
    );
    matchesRef.current = updatedMatches;
    setMatches(updatedMatches);
    await saveMatchesToStorage(updatedMatches);
    return newMatch;
  };

  const addTeams = async (teamDataList) => {
    let colorSource = [...teamsRef.current];
    const teamsWithColors = teamDataList.map((teamData) => {
      const coloredTeam = {
        ...teamData,
        color: teamData.color || getNextTeamColor(colorSource),
      };
      colorSource = [...colorSource, coloredTeam];
      return coloredTeam;
    });
    const { createdTeams, teams: updatedTeams } = addTeamsToList(
      teamsRef.current,
      teamsWithColors
    );
    teamsRef.current = updatedTeams;
    setTeams(updatedTeams);
    await saveTeamsToStorage(updatedTeams);
    return createdTeams;
  };

  const saveTournamentsToStorage = async (tournamentsData) => {
    try {
      await AsyncStorage.setItem('tournaments', JSON.stringify(tournamentsData));
      await saveSnapshot(teamsRef.current, matchesRef.current, tournamentsData);
    } catch (error) {
      console.error('Error saving tournaments:', error);
      throw error;
    }
  };

  const scheduleMatches = async (matchDataList) => {
    const { createdMatches, matches: updatedMatches } = addMatchesToList(
      matchesRef.current,
      matchDataList
    );
    matchesRef.current = updatedMatches;
    setMatches(updatedMatches);
    await saveMatchesToStorage(updatedMatches);

    const updatedTournaments = tournamentsRef.current.map((tournament) => ({
      ...tournament,
      teamIds: tournament.teamIds.filter((id) => id !== teamId),
    }));
    tournamentsRef.current = updatedTournaments;
    setTournaments(updatedTournaments);
    await saveTournamentsToStorage(updatedTournaments);

    return createdMatches;
  };

  const updateMatch = async (matchId, matchData) => {
    const updatedMatches = updateMatchInList(matchesRef.current, matchId, matchData);
    matchesRef.current = updatedMatches;
    setMatches(updatedMatches);
    await saveMatchesToStorage(updatedMatches);
  };

  const deleteMatch = async (matchId) => {
    const updatedMatches = removeMatchFromList(matchesRef.current, matchId);
    matchesRef.current = updatedMatches;
    setMatches(updatedMatches);
    await saveMatchesToStorage(updatedMatches);
  };

  const deleteAllMatches = async () => {
    matchesRef.current = [];
    setMatches([]);
    await saveMatchesToStorage([]);
  };

  const addTournament = async (tournamentData) => {
    const { tournament, tournaments: updatedTournaments } = addTournamentToList(
      tournamentsRef.current,
      tournamentData
    );
    tournamentsRef.current = updatedTournaments;
    setTournaments(updatedTournaments);
    await saveTournamentsToStorage(updatedTournaments);
    return tournament;
  };

  const deleteTournament = async (tournamentId) => {
    const updatedTournaments = removeTournamentFromList(tournamentsRef.current, tournamentId);
    tournamentsRef.current = updatedTournaments;
    setTournaments(updatedTournaments);
    await saveTournamentsToStorage(updatedTournaments);
  };

  const updateTournament = async (tournamentId, tournamentData) => {
    const updatedTournaments = updateTournamentInList(
      tournamentsRef.current,
      tournamentId,
      tournamentData
    );
    tournamentsRef.current = updatedTournaments;
    setTournaments(updatedTournaments);
    await saveTournamentsToStorage(updatedTournaments);
  };

  const getMatchById = (matchId) => {
    return matches.find((match) => match.id === matchId);
  };

  const getTeamMatches = (teamId) => {
    return matches.filter(
      (match) => match.team1Id === teamId || match.team2Id === teamId
    );
  };

  const getMatchesByDate = (date) => {
    return matches.filter((match) => {
      const matchDate = new Date(match.date).toDateString();
      const filterDate = new Date(date).toDateString();
      return matchDate === filterDate;
    });
  };

  const updateMatchScore = async (matchId, team1Score, team2Score) => {
    const updatedMatches = matchesRef.current.map((match) =>
      match.id === matchId
        ? {
            ...match,
            team1Score,
            team2Score,
            status: 'Completed',
          }
        : match
    );
    matchesRef.current = updatedMatches;
    setMatches(updatedMatches);
    await saveMatchesToStorage(updatedMatches);
  };

  const value = {
    // Team state and methods
    teams,
    addTeam,
    addTeams,
    updateTeam,
    deleteTeam,
    deleteAllTeams,
    getTeamById,

    // Match state and methods
    matches,
    scheduleMatch,
    scheduleMatches,
    updateMatch,
    deleteMatch,
    deleteAllMatches,
    tournaments,
    addTournament,
    updateTournament,
    deleteTournament,
    getMatchById,
    getTeamMatches,
    getMatchesByDate,
    updateMatchScore,

    loading,
  };

  return (
    <SportsDataContext.Provider value={value}>
      {children}
    </SportsDataContext.Provider>
  );
};

export const useSportsData = () => {
  const context = useContext(SportsDataContext);
  if (!context) {
    throw new Error('useSportsData must be used within SportsDataProvider');
  }
  return context;
};
