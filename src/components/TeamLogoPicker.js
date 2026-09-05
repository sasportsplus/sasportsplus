import React, { useState } from 'react';
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const resizeImageFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Unable to read this image.'));
  reader.onload = () => {
    const image = new globalThis.Image();
    image.onerror = () => reject(new Error('The selected file is not a valid image.'));
    image.onload = () => {
      const maxSize = 256;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = globalThis.document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/webp', 0.82));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

export default function TeamLogoPicker({ value, onChange, disabled = false }) {
  const [errorMessage, setErrorMessage] = useState('');

  const handleWebFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    try {
      onChange(await resizeImageFile(file));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Team Logo</Text>
      <View style={styles.row}>
        <View style={styles.preview}>
          {value ? <Image source={{ uri: value }} style={styles.image} /> : <Text style={styles.placeholder}>LOGO</Text>}
        </View>
        <View style={styles.controls}>
          {Platform.OS === 'web' ? React.createElement('input', {
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp,image/gif',
            disabled,
            onChange: handleWebFile,
            style: { maxWidth: '100%', color: '#444' },
          }) : (
            <TextInput
              style={styles.urlInput}
              value={value}
              onChangeText={onChange}
              placeholder="Enter logo image URL"
              editable={!disabled}
            />
          )}
          <Text style={styles.helpText}>PNG, JPG, WebP, or GIF. Images are resized for local storage.</Text>
          {value ? (
            <TouchableOpacity onPress={() => onChange('')} disabled={disabled}>
              <Text style={styles.removeText}>Remove logo</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preview: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eef1f5', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  image: { width: 72, height: 72 },
  placeholder: { color: '#999', fontSize: 11, fontWeight: '700' },
  controls: { flex: 1, gap: 5 },
  helpText: { color: '#888', fontSize: 11, lineHeight: 15 },
  removeText: { color: '#d52222', fontSize: 12, fontWeight: '600' },
  errorText: { color: '#b00020', fontSize: 12, marginTop: 7 },
  urlInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 7, padding: 9, color: '#333' },
});
