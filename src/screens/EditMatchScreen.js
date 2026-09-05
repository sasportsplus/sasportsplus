import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSportsData } from '../context/SportsDataContext';

export default function EditMatchScreen({ navigation, route }) {
  const { matchId } = route.params;
  const { getMatchById, updateMatch, getTeamById, teams } = useSportsData();

  const [match, setMatch] = useState(null);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [status, setStatus] = useState('Scheduled');
  const [venue, setVenue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentMatch = getMatchById(matchId);
    if (currentMatch) {
      setMatch(currentMatch);
      setTeam1Score(currentMatch.team1Score?.toString() || '0');
      setTeam2Score(currentMatch.team2Score?.toString() || '0');
      setStatus(currentMatch.status || 'Scheduled');
      setVenue(currentMatch.venue || '');
    }
  }, [matchId, getMatchById]);

  const handleUpdateMatch = async () => {
    if (!venue.trim()) {
      Alert.alert('Error', 'Please enter venue');
      return;
    }

    if (!team1Score && team1Score !== '0') {
      Alert.alert('Error', 'Please enter team 1 score');
      return;
    }

    if (!team2Score && team2Score !== '0') {
      Alert.alert('Error', 'Please enter team 2 score');
      return;
    }

    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    if (isNaN(score1) || isNaN(score2)) {
      Alert.alert('Error', 'Please enter valid scores');
      return;
    }

    setLoading(true);

    try {
      await updateMatch(matchId, {
        team1Score: score1,
        team2Score: score2,
        status: status,
        venue: venue.trim(),
      });

      navigation.goBack();
      Alert.alert('Success', 'Match updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update match. Please try again.');
      console.error('Update match error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Match Info Section */}
          <View style={styles.section}>
            <Text style={styles.title}>Match Details</Text>

            <View style={styles.matchInfoCard}>
              <View style={styles.matchInfoHeader}>
                <Text style={styles.dateText}>
                  📅 {new Date(match.date).toLocaleDateString()}
                </Text>
                <Text style={styles.timeText}>⏰ {match.time}</Text>
              </View>

              <View style={styles.teamsVsContainer}>
                <Text style={styles.teamName}>{match.team1Name}</Text>
                <Text style={styles.vs}>VS</Text>
                <Text style={styles.teamName}>{match.team2Name}</Text>
              </View>

              <Text style={styles.currentVenue}>📍 {match.venue}</Text>
            </View>
          </View>

          {/* Venue Update */}
          <View style={styles.section}>
            <Text style={styles.label}>Venue</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter venue"
              placeholderTextColor="#999"
              value={venue}
              onChangeText={setVenue}
              editable={!loading}
            />
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Match Status</Text>
            <View style={styles.statusOptions}>
              {['Scheduled', 'Completed', 'Cancelled'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.statusOption,
                    status === option && styles.statusOptionSelected,
                  ]}
                  onPress={() => setStatus(option)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      status === option && styles.statusOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scores Section - Only for Completed matches */}
          {status === 'Completed' && (
            <View style={styles.section}>
              <Text style={styles.label}>Final Scores</Text>

              <View style={styles.scoresContainer}>
                <View style={styles.scoreInputGroup}>
                  <Text style={styles.teamLabel}>{match.team1Name}</Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="Score"
                    placeholderTextColor="#999"
                    value={team1Score}
                    onChangeText={setTeam1Score}
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>

                <View style={styles.vsScore}>
                  <Text style={styles.vsScoreText}>VS</Text>
                </View>

                <View style={styles.scoreInputGroup}>
                  <Text style={styles.teamLabel}>{match.team2Name}</Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="Score"
                    placeholderTextColor="#999"
                    value={team2Score}
                    onChangeText={setTeam2Score}
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Winner Info */}
              {parseInt(team1Score) !== parseInt(team2Score) && (
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerLabel}>
                    🏆 Winner:{' '}
                    {parseInt(team1Score) > parseInt(team2Score)
                      ? match.team1Name
                      : match.team2Name}
                  </Text>
                </View>
              )}
              {parseInt(team1Score) === parseInt(team2Score) && team1Score !== '' && (
                <View style={styles.drawInfo}>
                  <Text style={styles.drawLabel}>🤝 Draw Match</Text>
                </View>
              )}
            </View>
          )}

          {/* Match Info Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Match Information</Text>
            <View style={styles.infoBox}>
              {match.tournamentName && (
                <Text style={styles.infoText}>
                  Tournament: <Text style={styles.infoBold}>{match.tournamentName}</Text>
                </Text>
              )}
              <Text style={styles.infoText}>
                Match ID: <Text style={styles.infoBold}>{match.id.substring(0, 8)}...</Text>
              </Text>
              <Text style={styles.infoText}>
                Created: <Text style={styles.infoBold}>{new Date(match.createdAt).toLocaleDateString()}</Text>
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleUpdateMatch}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Updating...' : 'Update Match'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  matchInfoCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  matchInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  teamsVsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
  },
  vs: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginHorizontal: 8,
  },
  currentVenue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  statusOptionSelected: {
    backgroundColor: '#007AFF',
  },
  statusOptionText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  statusOptionTextSelected: {
    color: '#fff',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  scoreInputGroup: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  scoreInput: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  vsScore: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  vsScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
  },
  winnerInfo: {
    backgroundColor: '#fffbf0',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8C00',
  },
  drawInfo: {
    backgroundColor: '#f0f8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#00aa55',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  drawLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00aa55',
  },
  infoBox: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  infoBold: {
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 15,
    marginVertical: 16,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
