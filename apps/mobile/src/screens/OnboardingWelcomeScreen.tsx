import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
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

export default function OnboardingWelcomeScreen({ navigation }: ScreenProps<'OnboardingWelcome'>) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.icon}>🎙️</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Debate anything. Fairly scored.</Text>
        <Text style={styles.body}>
          Squabble Up is where real people debate real topics. An AI moderator listens, scores fairly, and settles it.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('OnboardingInterests')}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    padding: 24,
  },
  top: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 64,
    color: COLORS.accentAmber,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
  },
  heading: {
    fontFamily: 'DM Serif Display',
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.accentAmber,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
})
