import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
import type { ScreenProps } from '../lib/types'
import { COLORS } from '../lib/design'
import { getAccessToken } from '../lib/authStore'

export default function EmailVerificationScreen({ navigation, route }: ScreenProps<'EmailVerification'>) {
  const { email } = route.params
  const [checking, setChecking] = useState(false)

  const handleVerified = async () => {
    setChecking(true)
    const token = await getAccessToken()
    if (token) {
      try {
        const { default: api } = await import('../lib/api')
        await api.get('/users/me')
      } catch {
        // proceed regardless — user can retry later
      }
    }
    setChecking(false)
    navigation.navigate('Main')
  }

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft color={COLORS.textPrimary} size={24} />
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

      <TouchableOpacity style={[styles.button, checking && styles.buttonDisabled]} onPress={handleVerified} disabled={checking}>
        {checking ? <ActivityIndicator color={COLORS.bgPrimary} /> : <Text style={styles.buttonText}>I've verified</Text>}
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
    fontFamily: 'Public Sans',
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
    fontFamily: 'Public Sans',
  },
  resendButton: {
    padding: 12,
  },
  resendText: {
    color: COLORS.accentAmber,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Public Sans',
  },
  button: {
    backgroundColor: COLORS.accentAmber,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Public Sans',
  },
})
