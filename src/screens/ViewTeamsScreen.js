import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { useSportsData } from '../context/SportsDataContext';
import { getTeamColor } from '../utils/teamColors';
import { formatTimeLabel } from '../utils/tournamentScheduler';

export default function ViewTeamsScreen({ navigation }) {
  const { teams, tournaments, deleteTeam, deleteAllTeams } = useSportsData();
  const [refreshing, setRefreshing] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [activeTournamentId, setActiveTournamentId] = useState('all');

  const activeTournament = tournaments.find(
    (tournament) => tournament.id === activeTournamentId
  );
  const visibleTeams = useMemo(() => {
    if (!activeTournament) return teams;
    const teamIds = new Set(activeTournament.teamIds);
    return teams.filter((team) => teamIds.has(team.id));
  }, [activeTournament, teams]);

  useEffect(() => {
    if (activeTournamentId !== 'all' && !activeTournament) {
      setActiveTournamentId('all');
    }
  }, [activeTournament, activeTournamentId]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  const deleteConfirmedTeam = async (teamId) => {
    try {
      await deleteTeam(teamId);
      Alert.alert('Success', 'Team deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete team');
    }
  };

  const handleDeleteTeam = (teamId, teamName) => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm(`Delete "${teamName}" and its associated matches?`)) {
        deleteConfirmedTeam(teamId);
      }
      return;
    }

    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete "${teamName}"? All associated matches will also be deleted.`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => deleteConfirmedTeam(teamId),
          style: 'destructive',
        },
      ]
    );
  };

  const deleteAllConfirmed = async () => {
    setDeletingAll(true);
    try {
      await deleteAllTeams();
      Alert.alert('Teams deleted', 'All teams, matches, and tournament pools were deleted.');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete all teams. Please try again.');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteAllTeams = () => {
    const message = `Delete all ${teams.length} teams? All matches and tournament pools will also be deleted. This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) deleteAllConfirmed();
      return;
    }

    Alert.alert('Delete All Teams', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', onPress: deleteAllConfirmed, style: 'destructive' },
    ]);
  };

  const renderTeamCard = ({ item }) => (
    <View style={[styles.teamCard, { borderLeftColor: getTeamColor(item, teams) }]}>
      <View style={styles.teamCardHeader}>
        <View style={[styles.teamIconContainer, { backgroundColor: `${getTeamColor(item, teams)}18` }]}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.teamLogo} resizeMode="cover" />
          ) : (
            <Text style={styles.teamIcon}>👥</Text>
          )}
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamDetail}>Captain: {item.captain || item.coach || 'N/A'}</Text>
          <Text style={styles.teamDetail}>Players: {item.players}</Text>
          <Text style={styles.teamDetail}>
            Preferred times: {item.preferredTimeSlots?.length
              ? item.preferredTimeSlots.map(formatTimeLabel).join(', ')
              : 'Any available time'}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.teamDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.teamCardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditTeam', { teamId: item.id })}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTeam(item.id, item.name)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📭</Text>
      <Text style={styles.emptyStateTitle}>
        {activeTournament ? 'No Teams in This Tournament' : 'No Teams Yet'}
      </Text>
      <Text style={styles.emptyStateText}>
        {activeTournament
          ? 'Edit the tournament pool to assign teams.'
          : 'Start by adding your first team to get started!'}
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate(activeTournament ? 'TournamentPools' : 'AddTeam')}
      >
        <Text style={styles.emptyStateButtonText}>
          {activeTournament ? 'Edit Tournament Pool' : 'Add First Team'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Teams</Text>
          <Text style={styles.headerSubtitle}>
            {activeTournament ? activeTournament.name : 'All Teams'} · {visibleTeams.length} teams
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.poolsButton}
            onPress={() => navigation.navigate('TournamentPools')}
          >
            <Text style={styles.addButtonText}>Pools</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTeam')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTournamentId === 'all' && styles.tabActive]}
          onPress={() => setActiveTournamentId('all')}
        >
          <Text style={[styles.tabText, activeTournamentId === 'all' && styles.tabTextActive]}>
            All Teams ({teams.length})
          </Text>
        </TouchableOpacity>
        {tournaments.map((tournament) => {
          const teamCount = tournament.teamIds.filter((teamId) =>
            teams.some((team) => team.id === teamId)
          ).length;
          const selected = activeTournamentId === tournament.id;
          return (
            <TouchableOpacity
              key={tournament.id}
              style={[styles.tab, selected && styles.tabActive]}
              onPress={() => setActiveTournamentId(tournament.id)}
            >
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                {tournament.name} ({teamCount})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {teams.length > 0 ? (
        <TouchableOpacity
          style={[styles.deleteAllButton, deletingAll && styles.deleteAllButtonDisabled]}
          onPress={handleDeleteAllTeams}
          disabled={deletingAll}
        >
          <Text style={styles.deleteAllButtonText}>
            {deletingAll ? 'Deleting all teams...' : 'Delete All Teams'}
          </Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={visibleTeams}
        renderItem={renderTeamCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  poolsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
  },
  teamCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  teamIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamIcon: {
    fontSize: 24,
  },
  tabsContainer: {
    flexGrow: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e5e9',
  },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#eef1f5',
  },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { color: '#555', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  deleteAllButton: {
    marginHorizontal: 12,
    marginTop: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 8,
    backgroundColor: '#fff5f5',
  },
  deleteAllButtonDisabled: { opacity: 0.55 },
  deleteAllButtonText: { color: '#c62828', fontSize: 14, fontWeight: '700' },
  teamLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  teamDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  teamDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    lineHeight: 18,
  },
  teamCardActions: {
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
