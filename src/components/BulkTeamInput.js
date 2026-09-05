import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { parseTeamNames } from '../utils/bulkTeamNames';

export default function BulkTeamInput({ existingTeams = [], onCreate, disabled = false }) {
  const [value, setValue] = useState('');
  const parsedNames = useMemo(() => parseTeamNames(value), [value]);
  const existingNames = useMemo(
    () => new Set(existingTeams.map((team) => team.name.trim().toLocaleLowerCase())),
    [existingTeams]
  );
  const newNames = parsedNames.filter((name) => !existingNames.has(name.toLocaleLowerCase()));
  const duplicateCount = parsedNames.length - newNames.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Add Teams</Text>
      <Text style={styles.helpText}>
        Paste team names separated by commas or new lines.
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder={'Eagles, Tigers, Panthers\nWarriors'}
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!disabled}
      />

      {parsedNames.length > 0 ? (
        <View style={styles.preview}>
          {newNames.map((name) => (
            <View key={name.toLocaleLowerCase()} style={styles.chip}>
              <Text style={styles.chipText}>{name}</Text>
            </View>
          ))}
          {duplicateCount > 0 ? (
            <Text style={styles.duplicateText}>{duplicateCount} existing team(s) skipped</Text>
          ) : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, (disabled || newNames.length === 0) && styles.buttonDisabled]}
        disabled={disabled || newNames.length === 0}
        onPress={() => onCreate(newNames)}
      >
        <Text style={styles.buttonText}>
          {disabled
            ? 'Creating...'
            : newNames.length
              ? `Create ${newNames.length} Team${newNames.length === 1 ? '' : 's'}`
              : 'Create Teams'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eaf4ff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    padding: 18,
  },
  title: { fontSize: 19, fontWeight: '700', color: '#163a63' },
  helpText: { color: '#476681', fontSize: 12, marginTop: 5, marginBottom: 12 },
  input: {
    minHeight: 92,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bcd7f2',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#222',
  },
  preview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' },
  chip: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { color: '#24527a', fontSize: 12, fontWeight: '600' },
  duplicateText: { color: '#a05a00', fontSize: 11 },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 13, alignItems: 'center', marginTop: 14 },
  buttonDisabled: { backgroundColor: '#aebdca' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
