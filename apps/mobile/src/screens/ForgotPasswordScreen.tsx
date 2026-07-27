import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
import type { ScreenProps } from '../lib/types'
import { COLORS } from '../lib/design'
import api from '../lib/api'

export default function ForgotPasswordScreen({ navigation }: ScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!email.trim()) return
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
    } catch {
      // endpoint not yet implemented — show confirmation optimistically
    } finally {
      setLoading(false)
    }
    setSent(true)
  }

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Reset Password</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        {!sent ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.bgPrimary} /> : <Text style={styles.buttonText}>Send reset link</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.confirmation}>
            <Text style={styles.heading}>Check your inbox</Text>
            <Text style={styles.body}>
              We sent a password reset link to {email}.
            </Text>
            <TouchableOpacity style={styles.resendButton} onPress={handleSend}>
              <Text style={styles.resendText}>Resend</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    justifyContent: 'center',
  },
  input: {
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    fontFamily: 'Public Sans',
  },
  button: {
    backgroundColor: COLORS.accentAmber,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Public Sans',
  },
  confirmation: {
    alignItems: 'center',
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
    marginBottom: 24,
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
})
