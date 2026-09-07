import React, { useState } from 'react';
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
import TeamLogoPicker from '../components/TeamLogoPicker';
import PreferredTimeSlotsPicker from '../components/PreferredTimeSlotsPicker';
import BulkTeamInput from '../components/BulkTeamInput';

export default function AddTeamScreen({ navigation }) {
  const [teamName, setTeamName] = useState('');
  const [captain, setCaptain] = useState('');
  const [players, setPlayers] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [preferredTimeSlots, setPreferredTimeSlots] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { teams, addTeam, addTeams } = useSportsData();

  const handleBulkAdd = async (names) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await addTeams(names.map((name) => ({
        name,
        captain: '',
        players: 0,
        description: '',
        logo: '',
        preferredTimeSlots: [],
        whatsappNumber: '',
      })));
      navigation.goBack();
      Alert.alert('Success', `${names.length} team${names.length === 1 ? '' : 's'} added successfully!`);
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to add teams. Please try again.');
      Alert.alert('Error', 'Failed to add teams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async () => {
    setErrorMessage('');

    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter team name');
      return;
    }

    if (teamName.trim().length < 2) {
      Alert.alert('Error', 'Team name must be at least 2 characters');
      return;
    }

    if (!players.trim()) {
      Alert.alert('Error', 'Please enter number of players');
      return;
    }

    const playerCount = parseInt(players);
    if (isNaN(playerCount) || playerCount < 1) {
      Alert.alert('Error', 'Please enter a valid number of players');
      return;
    }

    setLoading(true);

    try {
      await addTeam({
        name: teamName.trim(),
        captain: captain.trim(),
        players: playerCount,
        description: description.trim(),
        logo,
        preferredTimeSlots,
        whatsappNumber: whatsappNumber.trim(),
      });

      navigation.goBack();
      Alert.alert('Success', 'Team added successfully!');
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to add team. Please try again.');
      Alert.alert('Error', 'Failed to add team. Please try again.');
      console.error('Add team error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <BulkTeamInput
            existingTeams={teams}
            onCreate={handleBulkAdd}
            disabled={loading}
          />

          <View style={styles.formContainer}>
            <Text style={styles.title}>Add One Team with Details</Text>

            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            <TeamLogoPicker value={logo} onChange={setLogo} disabled={loading} />

            <PreferredTimeSlotsPicker
              value={preferredTimeSlots}
              onChange={setPreferredTimeSlots}
              disabled={loading}
            />

            {/* Team Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter team name (e.g., Eagles)"
                placeholderTextColor="#999"
                value={teamName}
                onChangeText={setTeamName}
                editable={!loading}
              />
            </View>

            {/* Captain Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Captain Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter captain name"
                placeholderTextColor="#999"
                value={captain}
                onChangeText={setCaptain}
                editable={!loading}
              />
            </View>

            {/* Number of Players */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Players *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter number of players"
                placeholderTextColor="#999"
                value={players}
                onChangeText={setPlayers}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>WhatsApp Number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit WhatsApp number"
                placeholderTextColor="#999"
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter team description"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
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
                onPress={handleAddTeam}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Adding...' : 'Add Team'}
                </Text>
              </TouchableOpacity>
            </View>
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
  formContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#b00020',
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
