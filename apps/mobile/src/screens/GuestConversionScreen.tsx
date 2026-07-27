import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import type { ScreenProps } from '../lib/types'
import api from '../lib/api'
import { setAccessToken } from '../lib/authStore'
import { COLORS } from '../lib/design'

export default function GuestConversionScreen({ navigation, route }: ScreenProps<'GuestConversion'>) {
  const { displayName, guestSessionId } = route.params
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [nameConflict, setNameConflict] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(displayName)

  const handleConvert = async () => {
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      Alert.alert('Error', 'All fields are required.')
      return
    }
    if (trimmedPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.')
      return
    }
    if (trimmedPassword !== trimmedConfirm) {
      Alert.alert('Error', 'Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        email: trimmedEmail,
        password: trimmedPassword,
        display_name: nameConflict ? newDisplayName : displayName,
        guest_session_id: guestSessionId,
      })
      const data = res.data
      if (data.token) {
        await setAccessToken(data.token)
      }
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Conversion failed.'
      if (message.includes('name') && message.includes('taken')) {
        setNameConflict(true)
        Alert.alert('Name Taken', 'This display name is already in use. Please choose another.')
        return
      }
      if (message.includes('email')) {
        Alert.alert('Email Taken', 'An account with this email already exists.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => navigation.replace('Auth') },
        ])
        return
      }
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Make it permanent</Text>
        <Text style={styles.subtitle}>
          Your display name '{nameConflict ? newDisplayName : displayName}' will be saved.
        </Text>

        {nameConflict && (
          <View style={styles.field}>
            <Text style={styles.label}>New Display Name</Text>
            <TextInput
              style={styles.input}
              value={newDisplayName}
              onChangeText={setNewDisplayName}
              placeholder="Choose a new name"
              placeholderTextColor={COLORS.textMuted}
              maxLength={50}
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConvert}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 22, color: COLORS.textPrimary, fontFamily: 'DM Serif Display', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32, fontFamily: 'Public Sans' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, fontFamily: 'Public Sans' },
  input: {
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    fontFamily: 'Public Sans',
  },
  button: { backgroundColor: COLORS.accentAmber, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: COLORS.bgPrimary, fontFamily: 'Public Sans' },
})
