import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSportsData } from '../context/SportsDataContext';
import { getTeamColor } from '../utils/teamColors';

export default function TournamentPoolsScreen({ navigation }) {
  const { teams, tournaments, addTournament, updateTournament, deleteTournament } = useSportsData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [poolSize, setPoolSize] = useState(8);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState(null);

  const selectPoolSize = (size) => {
    setPoolSize(size);
    setSelectedTeamIds((current) => current.slice(0, size));
    setErrorMessage('');
  };

  const toggleTeam = (teamId) => {
    setErrorMessage('');
    setSelectedTeamIds((current) => {
      if (current.includes(teamId)) return current.filter((id) => id !== teamId);
      if (current.length >= poolSize) return current;
      return [...current, teamId];
    });
  };

  const resetForm = () => {
    setName('');
    setPoolSize(8);
    setSelectedTeamIds([]);
    setErrorMessage('');
    setShowForm(false);
    setEditingTournamentId(null);
  };

  const startEditing = (tournament) => {
    setEditingTournamentId(tournament.id);
    setName(tournament.name);
    setPoolSize(tournament.poolSize);
    setSelectedTeamIds(tournament.teamIds.filter((teamId) => teams.some((team) => team.id === teamId)));
    setErrorMessage('');
    setShowForm(true);
  };

  const savePool = async () => {
    if (!Number.isInteger(poolSize) || poolSize < 2 || poolSize > 10) {
      setErrorMessage('Pool size must be between 2 and 10 teams.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Enter a tournament name.');
      return;
    }
    if (tournaments.some((tournament) =>
      tournament.id !== editingTournamentId
      && tournament.name.trim().toLowerCase() === name.trim().toLowerCase()
    )) {
      setErrorMessage('A tournament with this name already exists.');
      return;
    }
    if (!editingTournamentId && selectedTeamIds.length !== poolSize) {
      setErrorMessage(`Select exactly ${poolSize} teams.`);
      return;
    }
    if (editingTournamentId && selectedTeamIds.length > poolSize) {
      setErrorMessage(`This pool can contain no more than ${poolSize} teams.`);
      return;
    }

    setSaving(true);
    try {
      if (editingTournamentId) {
        await updateTournament(editingTournamentId, {
          name: name.trim(),
          poolSize,
          teamIds: selectedTeamIds,
        });
      } else {
        await addTournament({ name: name.trim(), poolSize, teamIds: selectedTeamIds });
      }
      const successMessage = editingTournamentId
        ? `${name.trim()} was updated with ${selectedTeamIds.length}/${poolSize} teams.`
        : `${name.trim()} was created with ${poolSize} teams.`;
      resetForm();
      Alert.alert(editingTournamentId ? 'Tournament updated' : 'Tournament created', successMessage);
    } catch (error) {
      console.error('Create tournament error:', error);
      setErrorMessage(error?.message || 'Unable to create tournament.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (tournament) => {
    const performDelete = async () => {
      try {
        await deleteTournament(tournament.id);
      } catch (error) {
        Alert.alert('Error', 'Unable to delete tournament pool.');
      }
    };
    const message = `Delete the ${tournament.name} pool? Existing match history will be kept.`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) performDelete();
      return;
    }
    Alert.alert('Delete tournament', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: performDelete },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tournament Pools</Text>
            <Text style={styles.headerSubtitle}>{tournaments.length} tournaments</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => showForm ? resetForm() : setShowForm(true)}
          >
            <Text style={styles.addButtonText}>{showForm ? 'Close' : '+ New Pool'}</Text>
          </TouchableOpacity>
        </View>

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingTournamentId ? 'Edit Tournament Pool' : 'Create Tournament Pool'}
            </Text>
            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
            <Text style={styles.label}>Tournament name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tournament name"
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>Pool size</Text>
            <View style={styles.sizeRow}>
              {[6, 8, 9, 10].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeButton, poolSize === size && styles.sizeButtonActive]}
                  onPress={() => selectPoolSize(size)}
                >
                  <Text style={[styles.sizeText, poolSize === size && styles.sizeTextActive]}>{size} teams</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.poolSizeInput]}
              value={String(poolSize)}
              onChangeText={(value) => selectPoolSize(Number.parseInt(value, 10) || 0)}
              keyboardType="number-pad"
              placeholder="Custom size (2-10)"
              placeholderTextColor="#999"
            />
            <View style={styles.selectionHeader}>
              <Text style={styles.label}>Select teams</Text>
              <Text style={styles.count}>{selectedTeamIds.length}/{poolSize}</Text>
            </View>
            <View style={styles.teamActionsRow}>
              <Text style={styles.teamHelpText}>
                Add a new team record, then select it below. Remove another team first if the pool is full.
              </Text>
              <TouchableOpacity
                style={styles.createTeamButton}
                onPress={() => navigation.navigate('AddTeam')}
              >
                <Text style={styles.createTeamButtonText}>+ Create New Team</Text>
              </TouchableOpacity>
            </View>
            {editingTournamentId && selectedTeamIds.length < poolSize ? (
              <Text style={styles.poolWarning}>
                This pool is short by {poolSize - selectedTeamIds.length} team(s). You can save it now, but scheduling is disabled until it is full.
              </Text>
            ) : null}
            <View style={styles.teamGrid}>
              {teams.map((team) => {
                const selected = selectedTeamIds.includes(team.id);
                const color = getTeamColor(team, teams);
                return (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.teamChoice,
                      { borderColor: color },
                      selected && { backgroundColor: color },
                    ]}
                    onPress={() => toggleTeam(team.id)}
                  >
                    <Text style={[styles.teamChoiceText, { color }, selected && styles.selectedTeamText]}>
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={savePool}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : editingTournamentId ? 'Save Changes' : 'Create Tournament'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {tournaments.map((tournament) => {
          const poolTeams = tournament.teamIds
            .map((teamId) => teams.find((team) => team.id === teamId))
            .filter(Boolean);
          const totalMatches = tournament.poolSize * (tournament.poolSize - 1) / 2;
          return (
            <View key={tournament.id} style={styles.poolCard}>
              <View style={styles.poolHeader}>
                <View>
                  <Text style={styles.poolName}>{tournament.name}</Text>
                  <Text style={styles.poolMeta}>
                    {poolTeams.length}/{tournament.poolSize} teams · {tournament.poolSize - 1} matches per team · {totalMatches} total
                  </Text>
                </View>
                <View style={styles.poolActions}>
                  <TouchableOpacity onPress={() => startEditing(tournament)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(tournament)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.poolTeams}>
                {poolTeams.map((team) => (
                  <View key={team.id} style={[styles.teamTag, { backgroundColor: getTeamColor(team, teams) }]}>
                    <Text style={styles.teamTagText}>{team.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {!showForm && tournaments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tournament pools yet</Text>
            <Text style={styles.emptyText}>Create a pool with 2 to 10 teams to begin scheduling.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { paddingBottom: 30 },
  header: { backgroundColor: '#007AFF', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#dcecff', fontSize: 12, marginTop: 4 },
  addButton: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 7 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  formCard: { backgroundColor: '#fff', margin: 15, padding: 18, borderRadius: 12 },
  formTitle: { fontSize: 19, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  error: { backgroundColor: '#fdecea', color: '#b00020', padding: 10, borderRadius: 7, marginBottom: 12 },
  poolWarning: { backgroundColor: '#fff5d9', color: '#8a5a00', padding: 10, borderRadius: 7, marginBottom: 10, fontSize: 12 },
  label: { color: '#444', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, color: '#222' },
  poolSizeInput: { marginTop: 10 },
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeButton: { flex: 1, padding: 11, alignItems: 'center', backgroundColor: '#eef1f5', borderRadius: 8 },
  sizeButtonActive: { backgroundColor: '#007AFF' },
  sizeText: { color: '#555', fontWeight: '700' },
  sizeTextActive: { color: '#fff' },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamActionsRow: { marginBottom: 10, gap: 8 },
  teamHelpText: { color: '#777', fontSize: 11, lineHeight: 15 },
  createTeamButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#007AFF', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 8 },
  createTeamButtonText: { color: '#007AFF', fontSize: 12, fontWeight: '700' },
  count: { color: '#007AFF', fontWeight: '700', marginTop: 10 },
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  teamChoice: { width: '48%', padding: 10, borderWidth: 1, borderRadius: 8 },
  teamChoiceText: { fontSize: 12, fontWeight: '700' },
  selectedTeamText: { color: '#fff' },
  saveButton: { backgroundColor: '#00a65a', padding: 14, alignItems: 'center', borderRadius: 8, marginTop: 18 },
  saveButtonText: { color: '#fff', fontWeight: '700' },
  disabledButton: { backgroundColor: '#aaa' },
  poolCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 12, padding: 16, borderRadius: 12 },
  poolHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  poolName: { color: '#222', fontSize: 18, fontWeight: 'bold' },
  poolMeta: { color: '#777', fontSize: 12, marginTop: 4 },
  deleteText: { color: '#d52222', fontWeight: '700', fontSize: 12 },
  poolActions: { flexDirection: 'row', gap: 12 },
  editText: { color: '#007AFF', fontWeight: '700', fontSize: 12 },
  poolTeams: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  teamTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  teamTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', margin: 30, padding: 25 },
  emptyTitle: { color: '#333', fontSize: 17, fontWeight: '700' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 8 },
});
