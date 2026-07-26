import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import type { ScreenProps } from '../lib/types'

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  bgElevated: '#333333',
  accentAmber: '#D4953A',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  borderSubtle: '#3A3A3A',
  successGreen: '#66BB6A',
  recordRed: '#E53935',
}

const PERSONAS = ['Casual', 'Competitive', 'Spectator'] as const
type Persona = (typeof PERSONAS)[number]

export default function OnboardingPersonaScreen({ navigation }: ScreenProps<'OnboardingPersona'>) {
  const [displayName, setDisplayName] = useState('')
  const [persona, setPersona] = useState<Persona | null>(null)

  const canProceed = displayName.trim().length > 0

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Who's debating?</Text>

      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your display name"
        placeholderTextColor={COLORS.textMuted}
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        maxLength={50}
      />

      <Text style={styles.label}>Persona</Text>
      <View style={styles.personaRow}>
        {PERSONAS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.personaCard, persona === item && styles.personaCardSelected]}
            onPress={() => setPersona(item)}
          >
            <Text style={[styles.personaText, persona === item && styles.personaTextSelected]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !canProceed && styles.buttonDisabled]}
        onPress={() => navigation.navigate('Auth', { displayName })}
        disabled={!canProceed}
      >
        <Text style={styles.buttonText}>Let's go</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    padding: 24,
    justifyContent: 'center',
  },
  heading: {
    fontFamily: 'DM Serif Display',
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  personaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  personaCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  personaCardSelected: {
    backgroundColor: COLORS.accentAmber,
    borderColor: COLORS.accentAmber,
  },
  personaText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  personaTextSelected: {
    color: COLORS.bgPrimary,
  },
  button: {
    backgroundColor: COLORS.accentAmber,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
})
