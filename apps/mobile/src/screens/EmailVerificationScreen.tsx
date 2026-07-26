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

export default function EmailVerificationScreen({ navigation, route }: ScreenProps<'EmailVerification'>) {
  const { email } = route.params

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Verify Email</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>✉️</Text>
        <Text style={styles.heading}>Check your inbox.</Text>
        <Text style={styles.body}>
          We sent a verification link to {email}. Tap the link to verify.
        </Text>

        <TouchableOpacity style={styles.resendButton}>
          <Text style={styles.resendText}>Resend email</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.buttonText}>I've verified</Text>
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
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    height: 48,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  appBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'DM Serif Display',
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  heading: {
    fontFamily: 'DM Serif Display',
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  resendButton: {
    padding: 12,
  },
  resendText: {
    color: COLORS.accentAmber,
    fontWeight: '600',
    fontSize: 14,
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
