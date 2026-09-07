import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ALL_TIME_SLOTS, formatTimeLabel } from '../utils/tournamentScheduler';

export default function PreferredTimeSlotsPicker({ value = [], onChange, disabled = false }) {
  const toggleSlot = (slot) => {
    if (disabled) return;
    onChange(
      value.includes(slot)
        ? value.filter((currentSlot) => currentSlot !== slot)
        : [...value, slot]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preferred Match Times</Text>
      <Text style={styles.helpText}>
        Optional. Leave all unselected if this team can play at any available time, including custom times.
      </Text>
      <View style={styles.slotGrid}>
        {ALL_TIME_SLOTS.map((slot) => {
          const selected = value.includes(slot);
          return (
            <TouchableOpacity
              key={slot}
              style={[styles.slotButton, selected && styles.slotButtonSelected]}
              onPress={() => toggleSlot(slot)}
              disabled={disabled}
            >
              <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                {formatTimeLabel(slot)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#333' },
  helpText: { color: '#777', fontSize: 12, lineHeight: 17 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  slotButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  slotButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  slotText: { color: '#555', fontSize: 12, fontWeight: '700' },
  slotTextSelected: { color: '#fff' },
});
