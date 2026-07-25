import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { loginWithEmail, registerWithEmail } from '../lib/auth'
import { setAccessToken } from '../lib/authStore'
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
  recordRed: '#E53935',
}

type Mode = 'login' | 'register'

export default function AuthScreen({ navigation }: ScreenProps<'Auth'>) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required.')
      return
    }
    if (mode === 'register' && !displayName) {
      Alert.alert('Error', 'Display name is required.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        const result = await loginWithEmail(email, password)
        if (result.access_token) {
          setAccessToken(result.access_token)
        }
        navigation.goBack()
      } else {
        await registerWithEmail(email, password, displayName)
        Alert.alert('Check your email', 'A verification link has been sent to your email address.')
        setMode('login')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>

      {mode === 'register' && (
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor={COLORS.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.textMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.bgPrimary} />
        ) : (
          <Text style={styles.buttonText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchMode}
        onPress={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          setDisplayName('')
        }}
      >
        <Text style={styles.switchModeText}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, padding: 16, justifyContent: 'center' },
  header: { fontFamily: 'DM Serif Display', fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: COLORS.bgSurface, color: COLORS.textPrimary, padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderSubtle },
  button: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, height: 48, justifyContent: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
  switchMode: { alignItems: 'center', padding: 12 },
  switchModeText: { color: COLORS.textSecondary, fontSize: 14 },
})
