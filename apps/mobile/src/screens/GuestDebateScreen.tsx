import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<any, 'GuestDebate'>

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  accentAmber: '#D4953A',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  recordRed: '#E53935',
}

export default function GuestDebateScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('')

  const handleStart = () => {
    if (displayName.trim().length < 2) {
      Alert.alert('Name required', 'Please enter a display name (at least 2 characters).')
      return
    }
    navigation.replace('CreateDebate', { guestName: displayName.trim() })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Debate without an account</Text>
      <Text style={styles.description}>
        Enter a display name and jump in. Scores will be saved for 24 hours.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Display name"
        placeholderTextColor={COLORS.textMuted}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={50}
        autoCapitalize="words"
      />

      <TouchableOpacity
        style={[styles.button, displayName.trim().length < 2 && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={displayName.trim().length < 2}
      >
        <Text style={styles.buttonText}>Start Debating</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Create an account instead</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, padding: 24, justifyContent: 'center' },
  header: { fontFamily: 'serif', fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  input: { backgroundColor: COLORS.bgSurface, color: COLORS.textPrimary, padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
  linkButton: { alignItems: 'center', padding: 12 },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
})
