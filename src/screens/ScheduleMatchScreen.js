import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSportsData } from '../context/SportsDataContext';
import {
  TOURNAMENT_MODES,
  WEEKDAY_TIME_SLOTS,
  WEEKEND_TIME_SLOTS,
  createTournamentDraft,
  formatLocalDate,
  getPairKey,
  normalizeTime,
  validateTournamentDraft,
  formatTimeLabel,
} from '../utils/tournamentScheduler';
import { getTeamColor } from '../utils/teamColors';

const MODE_DESCRIPTIONS = {
  [TOURNAMENT_MODES.WEEKDAY]: 'Monday-Friday - one match per team per day',
  [TOURNAMENT_MODES.SATURDAY]: 'Saturday only - one match per team per week',
  [TOURNAMENT_MODES.SUNDAY]: 'Sunday only - one match per team per week',
};

export default function ScheduleMatchScreen({ navigation }) {
  const { teams, matches, tournaments, scheduleMatches } = useSportsData();
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [mode, setMode] = useState(TOURNAMENT_MODES.WEEKDAY);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState(WEEKDAY_TIME_SLOTS);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [startDate, setStartDate] = useState(formatLocalDate(new Date()));
  const [defaultVenue, setDefaultVenue] = useState('Main Sports Ground');
  const [draftMatches, setDraftMatches] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [skippedMatchCount, setSkippedMatchCount] = useState(0);
  const [teamSlotQuotas, setTeamSlotQuotas] = useState({});

  const selectedTeams = useMemo(
    () => selectedTeamIds
      .map((teamId) => teams.find((team) => team.id === teamId))
      .filter(Boolean),
    [selectedTeamIds, teams]
  );

  const selectedTournament = tournaments.find(
    (tournament) => tournament.id === selectedTournamentId
  );

  const existingPairKeys = useMemo(() => {
    if (!selectedTournamentId) return [];
    const selectedIds = new Set(selectedTeamIds);
    const normalizedTournamentName = tournamentName.trim().toLowerCase();
    return [...new Set(matches
      .filter((match) =>
        match.status !== 'Cancelled'
        && selectedIds.has(match.team1Id)
        && selectedIds.has(match.team2Id)
        && (
          match.tournamentId === selectedTournamentId
          || (!match.tournamentId
            && String(match.tournamentName || '').trim().toLowerCase() === normalizedTournamentName)
        )
      )
      .map((match) => getPairKey(match.team1Id, match.team2Id)))];
  }, [matches, selectedTeamIds, selectedTournamentId, tournamentName]);

  const remainingMatchesByTeam = useMemo(() => {
    const excluded = new Set(existingPairKeys);
    return Object.fromEntries(selectedTeams.map((team) => [
      team.id,
      selectedTeams.filter((opponent) =>
        opponent.id !== team.id && !excluded.has(getPairKey(team.id, opponent.id))
      ).length,
    ]));
  }, [existingPairKeys, selectedTeams]);

  useEffect(() => {
    if (![8, 10].includes(selectedTeams.length) || selectedTimeSlots.length === 0) {
      setTeamSlotQuotas({});
      return;
    }
    try {
      const baseline = createTournamentDraft({
        teams: selectedTeams,
        mode,
        startDate: '2026-01-01',
        venue: 'Default',
        timeSlots: selectedTimeSlots,
        excludedPairKeys: existingPairKeys,
      });
      const quotas = Object.fromEntries(selectedTeams.map((team) => [
        team.id,
        Object.fromEntries(selectedTimeSlots.map((slot) => [slot, 0])),
      ]));
      baseline.forEach((fixture) => {
        quotas[fixture.team1Id][fixture.time] += 1;
        quotas[fixture.team2Id][fixture.time] += 1;
      });
      setTeamSlotQuotas(quotas);
    } catch (error) {
      setTeamSlotQuotas({});
    }
  }, [existingPairKeys, mode, selectedTeams, selectedTimeSlots]);

  const selectTournament = (tournament) => {
    setErrorMessage('');
    setSelectedTournamentId(tournament.id);
    setTournamentName(tournament.name);
    setSelectedTeamIds(tournament.teamIds);
    setDraftMatches([]);
  };

  const selectMode = (selectedMode) => {
    setMode(selectedMode);
    setSelectedTimeSlots(
      selectedMode === TOURNAMENT_MODES.WEEKDAY
        ? WEEKDAY_TIME_SLOTS
        : WEEKEND_TIME_SLOTS
    );
  };

  const toggleTimeSlot = (time) => {
    setErrorMessage('');
    setSelectedTimeSlots((current) =>
      current.includes(time)
        ? current.filter((slot) => slot !== time)
        : [...current, time]
    );
  };

  const updateTeamSlotQuota = (teamId, slot, value) => {
    const count = Math.max(0, Number.parseInt(value, 10) || 0);
    setErrorMessage('');
    setTeamSlotQuotas((current) => ({
      ...current,
      [teamId]: { ...current[teamId], [slot]: count },
    }));
  };

  const generateDraft = () => {
    setErrorMessage('');
    if (!selectedTournament) {
      setErrorMessage('Select a tournament pool.');
      return;
    }
    if (![8, 10].includes(selectedTeams.length)) {
      setErrorMessage('The tournament pool must contain exactly 8 or 10 available teams.');
      return;
    }
    if (!defaultVenue.trim()) {
      setErrorMessage('Enter a default venue.');
      return;
    }
    if (mode === TOURNAMENT_MODES.WEEKDAY && selectedTimeSlots.length === 0) {
      setErrorMessage('Select at least one weekday time slot.');
      return;
    }
    if (mode !== TOURNAMENT_MODES.WEEKDAY && ![3, 5].includes(selectedTimeSlots.length)) {
      setErrorMessage('Weekend tournaments require exactly 3 or all 5 time slots.');
      return;
    }

    try {
      const draft = createTournamentDraft({
        teams: selectedTeams,
        mode,
        startDate,
        venue: defaultVenue.trim(),
        timeSlots: selectedTimeSlots,
        excludedPairKeys: existingPairKeys,
        slotQuotas: teamSlotQuotas,
      });
      if (draft.length === 0) {
        setErrorMessage(`All ${selectedTeams.length * (selectedTeams.length - 1) / 2} pairings for this tournament are already recorded.`);
        return;
      }
      setSkippedMatchCount(existingPairKeys.length);
      setDraftMatches(draft);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const updateDraftMatch = (draftId, field, value) => {
    setErrorMessage('');
    setDraftMatches((current) => current.map((fixture) =>
      fixture.draftId === draftId ? { ...fixture, [field]: value } : fixture
    ));
  };

  const saveTournament = async () => {
    const validationError = validateTournamentDraft(
      draftMatches,
      mode,
      selectedTeams,
      teamSlotQuotas
    );
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const matchesToSave = draftMatches.map((fixture) => {
        const normalizedTime = normalizeTime(fixture.time);
        const scheduledAt = new Date(`${fixture.scheduledDate}T${normalizedTime}:00`);
        return {
          tournamentId: selectedTournamentId,
          tournamentName: tournamentName.trim(),
          tournamentMode: mode,
          round: fixture.round,
          team1Id: fixture.team1Id,
          team2Id: fixture.team2Id,
          team1Name: fixture.team1Name,
          team2Name: fixture.team2Name,
          date: scheduledAt.toISOString(),
          time: normalizedTime,
          venue: fixture.venue.trim(),
          team1Score: 0,
          team2Score: 0,
        };
      });

      await scheduleMatches(matchesToSave);
      navigation.navigate('ViewMatches');
      Alert.alert('Tournament scheduled', `${matchesToSave.length} remaining league matches were saved successfully.`);
    } catch (error) {
      console.error('Tournament scheduling error:', error);
      setErrorMessage(error?.message || 'Unable to save the tournament schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tournament Scheduler</Text>
          <Text style={styles.headerSubtitle}>Saved 8-team and 10-team round-robin pools</Text>
        </View>

        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

        {draftMatches.length === 0 ? (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Select tournament pool</Text>
              <View style={styles.tournamentGrid}>
                {tournaments.map((tournament) => (
                  <TouchableOpacity
                    key={tournament.id}
                    style={[
                      styles.tournamentButton,
                      selectedTournamentId === tournament.id && styles.tournamentButtonSelected,
                    ]}
                    onPress={() => selectTournament(tournament)}
                  >
                    <Text style={[
                      styles.tournamentButtonText,
                      selectedTournamentId === tournament.id && styles.tournamentButtonTextSelected,
                    ]}>
                      {tournament.name}
                    </Text>
                    <Text style={styles.tournamentSize}>{tournament.poolSize} teams</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {tournaments.length === 0 ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.getParent()?.navigate('TeamManagement', { screen: 'TournamentPools' })}
                >
                  <Text style={styles.secondaryButtonText}>Create a tournament pool</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Tournament type</Text>
              <View style={styles.modeRow}>
                {Object.values(TOURNAMENT_MODES).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modeButton, mode === option && styles.modeButtonSelected]}
                    onPress={() => selectMode(option)}
                  >
                    <Text style={[styles.modeText, mode === option && styles.modeTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helpText}>{MODE_DESCRIPTIONS[mode]}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Available match times</Text>
              <Text style={styles.helpText}>
                {mode === TOURNAMENT_MODES.WEEKDAY
                  ? 'Choose the morning slot, night slot, or both.'
                  : 'Choose exactly 3 slots or select all 5 slots.'}
              </Text>
              <View style={styles.slotGrid}>
                {(mode === TOURNAMENT_MODES.WEEKDAY
                  ? WEEKDAY_TIME_SLOTS
                  : WEEKEND_TIME_SLOTS
                ).map((time) => {
                  const selected = selectedTimeSlots.includes(time);
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.slotButton, selected && styles.slotButtonSelected]}
                      onPress={() => toggleTimeSlot(time)}
                    >
                      <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                        {formatTimeLabel(time)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Matches per time for each team</Text>
              <Text style={styles.helpText}>
                Set zero for a time the team cannot play. Each row must total the team's remaining matches.
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View style={styles.quotaTable}>
                  <View style={styles.quotaRow}>
                    <Text style={[styles.quotaTeamName, styles.quotaHeading]}>Team</Text>
                    {selectedTimeSlots.map((slot) => (
                      <Text key={slot} style={[styles.quotaCell, styles.quotaHeading]}>
                        {formatTimeLabel(slot)}
                      </Text>
                    ))}
                    <Text style={[styles.quotaTotal, styles.quotaHeading]}>Total</Text>
                  </View>
                  {selectedTeams.map((team) => {
                    const total = selectedTimeSlots.reduce(
                      (sum, slot) => sum + Number(teamSlotQuotas[team.id]?.[slot] || 0),
                      0
                    );
                    const required = remainingMatchesByTeam[team.id] || 0;
                    return (
                      <View key={team.id} style={styles.quotaRow}>
                        <Text style={styles.quotaTeamName} numberOfLines={1}>{team.name}</Text>
                        {selectedTimeSlots.map((slot) => (
                          <TextInput
                            key={slot}
                            style={styles.quotaInput}
                            value={String(teamSlotQuotas[team.id]?.[slot] || 0)}
                            onChangeText={(value) => updateTeamSlotQuota(team.id, slot, value)}
                            keyboardType="number-pad"
                            selectTextOnFocus
                          />
                        ))}
                        <Text style={[
                          styles.quotaTotal,
                          total === required ? styles.quotaTotalValid : styles.quotaTotalInvalid,
                        ]}>
                          {total}/{required}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>Tournament teams</Text>
                <Text style={styles.counter}>{selectedTeamIds.length} teams</Text>
              </View>
              <View style={styles.teamGrid}>
                {selectedTeams.map((team) => {
                  return (
                    <View
                      key={team.id}
                      style={[
                        styles.teamButton,
                        { borderColor: getTeamColor(team, teams) },
                        { backgroundColor: getTeamColor(team, teams) },
                      ]}
                    >
                      <Text style={[
                        styles.teamButtonText,
                        styles.teamButtonTextSelected,
                      ]}>
                        {team.name}
                      </Text>
                      {team.preferredTimeSlots?.length ? (
                        <Text style={styles.teamPreferenceText}>
                          {team.preferredTimeSlots.map(formatTimeLabel).join(', ')} only
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>First match date</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
              <Text style={styles.helpText}>
                The scheduler moves this to the next valid {mode.toLowerCase()} date when necessary.
              </Text>
              <Text style={[styles.label, styles.spacedLabel]}>Default venue</Text>
              <TextInput
                style={styles.input}
                value={defaultVenue}
                onChangeText={setDefaultVenue}
                placeholder="Venue"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={generateDraft}>
              <Text style={styles.primaryButtonText}>Generate remaining matches</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{tournamentName}</Text>
              <Text style={styles.summaryText}>
                {mode} tournament - {draftMatches.length} matches remaining
                {skippedMatchCount ? ` - ${skippedMatchCount} existing matches skipped` : ''}
              </Text>
              <Text style={styles.summaryText}>
                Edit dates, times, or venues below. Times may use 9:00, 09:00, or 9:00 AM format.
              </Text>
            </View>

            {draftMatches.map((fixture, index) => (
              <View key={fixture.draftId} style={styles.fixtureCard}>
                <View style={styles.fixtureHeader}>
                  <Text style={styles.roundText}>Round {fixture.round}</Text>
                  <Text style={styles.matchNumber}>Match {index + 1}</Text>
                </View>
                <Text style={styles.fixtureTeams}>{fixture.team1Name} vs {fixture.team2Name}</Text>
                <View style={styles.fieldRow}>
                  <View style={styles.field}>
                    <Text style={styles.smallLabel}>Date</Text>
                    <TextInput
                      style={styles.compactInput}
                      value={fixture.scheduledDate}
                      onChangeText={(value) => updateDraftMatch(fixture.draftId, 'scheduledDate', value)}
                    />
                  </View>
                  <View style={styles.timeField}>
                    <Text style={styles.smallLabel}>Time</Text>
                    <TextInput
                      style={styles.compactInput}
                      value={fixture.time}
                      onChangeText={(value) => updateDraftMatch(fixture.draftId, 'time', value)}
                    />
                  </View>
                </View>
                <Text style={styles.smallLabel}>Venue</Text>
                <TextInput
                  style={styles.compactInput}
                  value={fixture.venue}
                  onChangeText={(value) => updateDraftMatch(fixture.draftId, 'venue', value)}
                />
              </View>
            ))}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setDraftMatches([]); setErrorMessage(''); }}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={saveTournament}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : `Save ${draftMatches.length} matches`}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  scrollContent: { paddingBottom: 32 },
  header: { backgroundColor: '#007AFF', padding: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#dcecff', fontSize: 13, marginTop: 5 },
  errorMessage: { margin: 15, marginBottom: 0, padding: 12, color: '#b00020', backgroundColor: '#fdecea', borderRadius: 8 },
  section: { backgroundColor: '#fff', margin: 15, marginBottom: 0, padding: 16, borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 9 },
  spacedLabel: { marginTop: 18 },
  input: { borderWidth: 1, borderColor: '#d8dbe2', borderRadius: 8, padding: 12, color: '#222' },
  tournamentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tournamentButton: { minWidth: 150, padding: 12, borderRadius: 8, backgroundColor: '#eef1f5', borderWidth: 1, borderColor: '#d8dbe2' },
  tournamentButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  tournamentButtonText: { color: '#333', fontWeight: '700', fontSize: 13 },
  tournamentButtonTextSelected: { color: '#fff' },
  tournamentSize: { color: '#8a8a8a', fontSize: 11, marginTop: 3 },
  helpText: { color: '#777', fontSize: 12, lineHeight: 17, marginTop: 8 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 8, backgroundColor: '#eef1f5' },
  modeButtonSelected: { backgroundColor: '#007AFF' },
  modeText: { color: '#555', fontSize: 12, fontWeight: '700' },
  modeTextSelected: { color: '#fff' },
  counter: { color: '#007AFF', fontWeight: '700' },
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  slotButton: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eef1f5', borderWidth: 1, borderColor: '#e0e3e8' },
  slotButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  slotText: { color: '#555', fontSize: 12, fontWeight: '700' },
  slotTextSelected: { color: '#fff' },
  teamButton: { width: '48%', padding: 11, borderRadius: 8, backgroundColor: '#eef1f5', borderWidth: 1, borderColor: '#e0e3e8' },
  teamButtonSelected: { backgroundColor: '#e4f1ff', borderColor: '#007AFF' },
  teamButtonText: { color: '#555', fontSize: 12, fontWeight: '600' },
  teamButtonTextSelected: { color: '#fff' },
  teamPreferenceText: { color: '#fff', opacity: 0.85, fontSize: 10, marginTop: 4 },
  quotaTable: { marginTop: 12 },
  quotaRow: { flexDirection: 'row', alignItems: 'center', minHeight: 42, borderBottomWidth: 1, borderBottomColor: '#edf0f3' },
  quotaTeamName: { width: 130, color: '#333', fontSize: 12, fontWeight: '600', paddingRight: 8 },
  quotaCell: { width: 78, textAlign: 'center' },
  quotaInput: { width: 78, marginHorizontal: 2, borderWidth: 1, borderColor: '#d8dbe2', borderRadius: 6, padding: 7, textAlign: 'center', color: '#222' },
  quotaTotal: { width: 58, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  quotaHeading: { color: '#667', fontSize: 11, fontWeight: '700' },
  quotaTotalValid: { color: '#168447' },
  quotaTotalInvalid: { color: '#c62828' },
  secondaryButton: { marginTop: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF', borderRadius: 8 },
  secondaryButtonText: { color: '#007AFF', fontWeight: '700' },
  primaryButton: { margin: 15, marginBottom: 0, backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  summaryCard: { margin: 15, marginBottom: 5, padding: 16, borderRadius: 12, backgroundColor: '#eaf4ff' },
  summaryTitle: { fontSize: 19, fontWeight: 'bold', color: '#163a63' },
  summaryText: { color: '#476681', fontSize: 12, marginTop: 5, lineHeight: 17 },
  fixtureCard: { marginHorizontal: 15, marginTop: 10, padding: 14, borderRadius: 10, backgroundColor: '#fff', borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  fixtureHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  roundText: { color: '#007AFF', fontSize: 12, fontWeight: '700' },
  matchNumber: { color: '#999', fontSize: 11 },
  fixtureTeams: { color: '#222', fontSize: 15, fontWeight: '700', marginVertical: 12 },
  fieldRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  field: { flex: 2 },
  timeField: { flex: 1 },
  smallLabel: { color: '#666', fontSize: 11, fontWeight: '600', marginBottom: 5 },
  compactInput: { borderWidth: 1, borderColor: '#d8dbe2', borderRadius: 7, padding: 9, color: '#222', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10, margin: 15 },
  cancelButton: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 9, backgroundColor: '#e7e9ed' },
  cancelButtonText: { color: '#444', fontWeight: '700' },
  saveButton: { flex: 2, padding: 14, alignItems: 'center', borderRadius: 9, backgroundColor: '#00a65a' },
  disabledButton: { backgroundColor: '#aaa' },
});
