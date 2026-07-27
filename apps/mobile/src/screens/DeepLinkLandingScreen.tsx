import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import type { ScreenProps } from '../lib/types'
import api from '../lib/api'
import { COLORS } from '../lib/design'

export default function DeepLinkLandingScreen({ navigation, route }: ScreenProps<'DeepLinkLanding'>) {
  const { url } = route.params
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const resolve = async () => {
      const match = url.match(/squabbleup:\/\/debate\/([^/]+)(?:\/(\w+))?/)
      if (!match) {
        navigation.replace('Main')
        return
      }

      const debateId = match[1]
      const path = match[2]

      try {
        const res = await api.get(`/debates/${debateId}`)
        const debate = res.data.data

        if (path === 'results' || debate.status === 'completed') {
          navigation.replace('Scoring', { debateId })
        } else if (debate.status === 'active') {
          navigation.replace('Voting', { debateId })
        } else if (debate.status === 'pending') {
          navigation.replace('DebateLobby', { debateId })
        } else {
          navigation.replace('Main')
        }
      } catch {
        navigation.replace('Main')
      }
    }

    const timer = setTimeout(resolve, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accentAmber} />
      <Text style={styles.text}>Joining debate...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: COLORS.textSecondary, marginTop: 16, fontFamily: 'Public Sans' },
})
