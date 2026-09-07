import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useSportsData } from '../context/SportsDataContext';
import { formatLocalDate, normalizeTime } from '../utils/tournamentScheduler';
import { getTeamColor } from '../utils/teamColors';

const formatTimeLabel = (time) => {
  const normalized = normalizeTime(time);
  if (!normalized) return time;
  const [hourValue, minutes] = normalized.split(':').map(Number);
  const suffix = hourValue >= 12 ? 'PM' : 'AM';
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export default function ViewMatchesScreen({ navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  const { teams, matches, tournaments, updateMatch, deleteMatch, deleteAllMatches } = useSportsData();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTeamId, setFilterTeamId] = useState('All');
  const [filterTournamentId, setFilterTournamentId] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterTime, setFilterTime] = useState('All');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const availableTimes = React.useMemo(() => (
    [...new Set(matches.map((match) => normalizeTime(match.time)).filter(Boolean))].sort()
  ), [matches]);
  const columnCount = windowWidth >= 1200 ? 4 : windowWidth >= 900 ? 3 : windowWidth >= 600 ? 2 : 1;
  const cardWidth = (windowWidth - 24 - (columnCount - 1) * 12) / columnCount;
  const hasActiveFilters = filterStatus !== 'All'
    || filterTournamentId !== 'All'
    || filterTeamId !== 'All'
    || Boolean(filterDate.trim())
    || filterTime !== 'All';

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  const getFilteredMatches = () => {
    return matches.filter((match) => {
      const matchesStatus = filterStatus === 'All' || match.status === filterStatus;
      const selectedTournament = tournaments.find(
        (tournament) => tournament.id === filterTournamentId
      );
      const matchesTournament = filterTournamentId === 'All'
        || match.tournamentId === filterTournamentId
        || (!match.tournamentId && match.tournamentName === selectedTournament?.name);
      const matchesTeam = filterTeamId === 'All'
        || match.team1Id === filterTeamId
        || match.team2Id === filterTeamId;
      const matchesDate = !filterDate.trim()
        || formatLocalDate(new Date(match.date)) === filterDate.trim();
      const matchesTime = filterTime === 'All'
        || normalizeTime(match.time) === filterTime;
      return matchesStatus && matchesTournament && matchesTeam && matchesDate && matchesTime;
    });
  };

  const clearFilters = () => {
    setFilterStatus('All');
    setFilterTournamentId('All');
    setFilterTeamId('All');
    setFilterDate('');
    setFilterTime('All');
  };

  const deleteConfirmedMatch = async (matchId) => {
    try {
      await deleteMatch(matchId);
      Alert.alert('Success', 'Match deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete match');
    }
  };

  const handleDeleteMatch = (matchId, team1Name, team2Name) => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm(`Delete the match between ${team1Name} and ${team2Name}?`)) {
        deleteConfirmedMatch(matchId);
      }
      return;
    }

    Alert.alert(
      'Delete Match',
      `Are you sure you want to delete the match between ${team1Name} and ${team2Name}?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => deleteConfirmedMatch(matchId),
          style: 'destructive',
        },
      ]
    );
  };

  const markMatchAsPlayed = async (match) => {
    try {
      const completedAt = new Date().toISOString();
      await updateMatch(match.id, {
        status: 'Completed',
        playedAt: completedAt,
        team1Fee: match.team1Fee ?? 5000,
        team2Fee: match.team2Fee ?? 5000,
        team1PaymentStatus: match.team1PaymentStatus || 'Pending',
        team2PaymentStatus: match.team2PaymentStatus || 'Pending',
        team1ReminderDueAt: completedAt,
        team2ReminderDueAt: completedAt,
      });
      Alert.alert('Match updated', 'The match has been marked as played.');
    } catch (error) {
      console.error('Mark match as played error:', error);
      Alert.alert('Error', 'Failed to mark the match as played.');
    }
  };

  const handleMarkPlayed = (match) => {
    const message = `Mark ${match.team1Name} vs ${match.team2Name} as played?`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) markMatchAsPlayed(match);
      return;
    }

    Alert.alert('Mark as played', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Played', onPress: () => markMatchAsPlayed(match) },
    ]);
  };

  const performDeleteAllMatches = async () => {
    try {
      await deleteAllMatches();
      clearFilters();
      Alert.alert('Matches deleted', 'All matches have been deleted.');
    } catch (error) {
      console.error('Delete all matches error:', error);
      Alert.alert('Error', 'Failed to delete all matches.');
    }
  };

  const handleDeleteAllMatches = () => {
    const message = `Delete all ${matches.length} matches? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) performDeleteAllMatches();
      return;
    }

    Alert.alert('Delete all matches', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: performDeleteAllMatches },
    ]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const dayName = date.toLocaleString('default', { weekday: 'short' });
    return `${dayName}, ${day} ${month}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return '#007AFF';
      case 'Completed':
        return '#00aa55';
      case 'Cancelled':
        return '#ff3b30';
      default:
        return '#999';
    }
  };

  const renderMatchCard = ({ item }) => (
    <View
      style={[
        styles.matchCard,
        { borderLeftColor: getStatusColor(item.status), width: cardWidth },
      ]}
    >
      <View style={styles.matchCardContent}>
        <View style={styles.matchHeader}>
          <View style={styles.matchDateTime}>
            <Text style={styles.matchDate}>{formatDate(item.date)}</Text>
            <Text style={styles.matchTimeBold}>{formatTimeLabel(item.time)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.venue}>📍 {item.venue}</Text>

        <View style={styles.teamsContainer}>
          <View style={styles.teamInfo}>
            {teams.find((team) => team.id === item.team1Id)?.logo ? (
              <Image
                source={{ uri: teams.find((team) => team.id === item.team1Id).logo }}
                style={styles.matchTeamLogo}
              />
            ) : null}
            <Text style={[styles.teamName, { color: getTeamColor(teams.find((team) => team.id === item.team1Id), teams) }]}>
              {item.team1Name}
            </Text>
            {item.status === 'Completed' && (
              <Text style={styles.score}>{item.team1Score}</Text>
            )}
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vs}>VS</Text>
          </View>

          <View style={[styles.teamInfo, styles.teamInfoRight]}>
            {teams.find((team) => team.id === item.team2Id)?.logo ? (
              <Image
                source={{ uri: teams.find((team) => team.id === item.team2Id).logo }}
                style={styles.matchTeamLogo}
              />
            ) : null}
            <Text style={[
              styles.teamName,
              styles.teamNameRight,
              { color: getTeamColor(teams.find((team) => team.id === item.team2Id), teams) },
            ]}>
              {item.team2Name}
            </Text>
            {item.status === 'Completed' && (
              <Text style={styles.score}>{item.team2Score}</Text>
            )}
          </View>
        </View>

        {item.tournamentName && (
          <Text style={styles.tournamentName}>Tournament: {item.tournamentName}</Text>
        )}

        <View style={styles.cardActions}>
          {item.status === 'Scheduled' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.playedButton]}
              onPress={() => handleMarkPlayed(item)}
            >
              <Text style={styles.playedButtonText}>Mark Played</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditMatch', { matchId: item.id })}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteMatch(item.id, item.team1Name, item.team2Name)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const filteredMatches = getFilteredMatches();

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📭</Text>
      <Text style={styles.emptyStateTitle}>No Matches Yet</Text>
      <Text style={styles.emptyStateText}>
        Schedule your first match to get started!
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('ScheduleMatch')}
      >
        <Text style={styles.emptyStateButtonText}>Schedule Match</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Matches</Text>
          <Text style={styles.headerSubtitle}>{filteredMatches.length} matches</Text>
        </View>
        <View style={styles.headerActions}>
          {matches.length > 0 ? (
            <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAllMatches}>
              <Text style={styles.deleteAllButtonText}>Delete All</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ScheduleMatch')}
          >
            <Text style={styles.addButtonText}>+ Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setFiltersExpanded((expanded) => !expanded)}
      >
        <View>
          <Text style={styles.filterToggleTitle}>Filters</Text>
          {hasActiveFilters ? <Text style={styles.activeFiltersText}>Filters are active</Text> : null}
        </View>
        <Text style={styles.filterToggleIcon}>{filtersExpanded ? '▲ Hide' : '▼ Show'}</Text>
      </TouchableOpacity>

      {filtersExpanded ? (
        <>
      <View style={styles.filterContainer}>
        {['All', 'Scheduled', 'Completed', 'Cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.teamFilterSection}>
        <Text style={styles.teamFilterLabel}>Filter by tournament</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.teamFilterContent}
        >
          {[{ id: 'All', name: 'All Tournaments' }, ...tournaments].map((tournament) => (
            <TouchableOpacity
              key={tournament.id}
              style={[
                styles.teamFilterButton,
                filterTournamentId === tournament.id && styles.teamFilterButtonActive,
              ]}
              onPress={() => setFilterTournamentId(tournament.id)}
            >
              <Text style={[
                styles.teamFilterButtonText,
                filterTournamentId === tournament.id && styles.teamFilterButtonTextActive,
              ]}>
                {tournament.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.teamFilterSection}>
        <Text style={styles.teamFilterLabel}>Filter by team</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.teamFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.teamFilterButton,
              filterTeamId === 'All' && styles.teamFilterButtonActive,
            ]}
            onPress={() => setFilterTeamId('All')}
          >
            <Text
              style={[
                styles.teamFilterButtonText,
                filterTeamId === 'All' && styles.teamFilterButtonTextActive,
              ]}
            >
              All Teams
            </Text>
          </TouchableOpacity>
          {teams.map((team) => (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.teamFilterButton,
                filterTeamId === team.id && styles.teamFilterButtonActive,
                filterTeamId === team.id && { backgroundColor: getTeamColor(team, teams), borderColor: getTeamColor(team, teams) },
              ]}
              onPress={() => setFilterTeamId(team.id)}
            >
              <Text
                style={[
                  styles.teamFilterButtonText,
                  filterTeamId === team.id && styles.teamFilterButtonTextActive,
                ]}
              >
                {team.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.dateTimeFilterSection}>
        <View style={styles.dateFilterHeader}>
          <Text style={styles.teamFilterLabel}>Filter by date and time</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.dateFilterInput}
          value={filterDate}
          onChangeText={setFilterDate}
          placeholder="Date: YYYY-MM-DD"
          placeholderTextColor="#999"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.teamFilterContent}
        >
          {['All', ...availableTimes].map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.teamFilterButton,
                filterTime === time && styles.teamFilterButtonActive,
              ]}
              onPress={() => setFilterTime(time)}
            >
              <Text
                style={[
                  styles.teamFilterButtonText,
                  filterTime === time && styles.teamFilterButtonTextActive,
                ]}
              >
                {time === 'All' ? 'All Times' : formatTimeLabel(time)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
        </>
      ) : null}

      <FlatList
        key={columnCount}
        data={filteredMatches}
        numColumns={columnCount}
        renderItem={renderMatchCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={columnCount > 1 ? styles.matchRow : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    marginHorizontal: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterToggle: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterToggleTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '700',
  },
  activeFiltersText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  filterToggleIcon: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteAllButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteAllButtonText: {
    color: '#d52222',
    fontSize: 12,
    fontWeight: '700',
  },
  teamFilterSection: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  teamFilterLabel: {
    marginHorizontal: 14,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  teamFilterContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  teamFilterButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  teamFilterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  teamFilterButtonText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
  },
  teamFilterButtonTextActive: {
    color: '#fff',
  },
  dateTimeFilterSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  clearFiltersText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateFilterInput: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#333',
    fontSize: 13,
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  matchRow: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  matchCardContent: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  venue: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#eee',
    borderBottomColor: '#eee',
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1,
  },
  teamInfoRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  teamNameRight: {
    color: '#ff1493',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vsContainer: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  vs: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
  },
  matchTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  tournamentName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#f0f7ff',
  },
  matchTeamLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginBottom: 6,
  },
  matchDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  matchTimeBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  playedButton: {
    backgroundColor: '#e4f8ed',
  },
  playedButtonText: {
    color: '#008744',
    fontSize: 12,
    fontWeight: '600',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ffe0e0',
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
