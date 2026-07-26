import { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { getAccessToken } from '../lib/authStore'
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

export default function SplashScreen({ navigation }: ScreenProps<'Splash'>) {
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken()
      if (token) {
        navigation.navigate('Main')
      } else {
        navigation.navigate('OnboardingWelcome')
      }
    }

    const timer = setTimeout(() => {
      void checkAuth()
    }, 1500)

    return () => clearTimeout(timer)
  }, [navigation])

  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>Squabble Up</Text>
      <Text style={styles.tagline}>Your opinion, scored.</Text>
      <ActivityIndicator style={styles.loader} color={COLORS.accentAmber} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  wordmark: {
    fontFamily: 'DM Serif Display',
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: 'Public Sans',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
})
