import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import type { Debate } from '@squabble-up/shared'
import { getDebate } from '../lib/debates'
import { getTopicByIdentifier } from '../lib/topics'
import { DEBATE_ROUNDS, ROUND_DURATIONS, ROUND_NUMBER_TO_TYPE } from '@squabble-up/shared'
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition'
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

export default function PreDebateScreen({ route, navigation }: ScreenProps<'PreDebate'>) {
  const { debateId, side } = route.params
  const [debate, setDebate] = useState<Debate | null>(null)
  const [topicTitle, setTopicTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown')

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const result = await getDebate(debateId)
        if (!result.success) throw new Error('Could not load debate')
        if (!cancelled) {
          setDebate(result.data)
          const topicResult = await getTopicByIdentifier(result.data.topic_id)
          if (!cancelled && topicResult.success) setTopicTitle(topicResult.data.title)
        }
      } catch {
        if (!cancelled) {
          Alert.alert('Error', 'Could not load debate.')
          navigation.goBack()
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [debateId, navigation])

  useEffect(() => {
    ExpoSpeechRecognitionModule.getPermissionsAsync().then((status) => {
      setMicPermission(status.granted ? 'granted' : 'denied')
    }).catch(() => {
      setMicPermission('unknown')
    })
  }, [])

  const requestMic = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      setMicPermission(result.granted ? 'granted' : 'denied')
    } catch {
      setMicPermission('granted')
    }
  }

  const handleStart = () => {
    navigation.replace('DebateRound', { debateId, roundNumber: 1, side })
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accentAmber} />
      </View>
    )
  }

  const rules = Array.from({ length: DEBATE_ROUNDS }, (_, i) => {
    const num = i + 1
    const type = ROUND_NUMBER_TO_TYPE[num as keyof typeof ROUND_NUMBER_TO_TYPE]
    const dur = type ? ROUND_DURATIONS[type] : 90
    const names: Record<number, string> = { 1: 'Opening', 2: 'Rebuttal', 3: 'Closing' }
    const prompts: Record<number, string> = { 1: 'State your case.', 2: 'Respond to their points.', 3: 'Make it count.' }
    return { num, name: names[num] || type, duration: dur, prompt: prompts[num] || '' }
  })

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Ready?</Text>
      {topicTitle && <Text style={styles.topicTitle}>{topicTitle}</Text>}

      <View style={styles.rulesCard}>
        {rules.map((r, index) => (
          <View key={r.num} style={[styles.ruleRow, index < rules.length - 1 && styles.ruleRowBorder]}>
            <Text style={styles.ruleNumber}>{r.num}</Text>
            <View style={styles.ruleBody}>
              <Text style={styles.ruleName}>{r.name} • {r.duration}s</Text>
              <Text style={styles.rulePrompt}>{r.prompt}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.tagline}>Be sharp, be fair, be heard.</Text>

      {micPermission !== 'granted' ? (
        <View style={styles.micCard}>
          <Text style={styles.micTitle}>Microphone access needed</Text>
          <Text style={styles.micBody}>Squabble Up needs microphone access to record your arguments.</Text>
          <TouchableOpacity style={styles.micButton} onPress={requestMic}>
            <Text style={styles.micButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.micCard}>
          <View style={styles.micOkDot} />
          <Text style={styles.micOkText}>Microphone ready</Text>
        </View>
      )}

      <View style={styles.opponentCard}>
        <Text style={styles.opponentLabel}>Opponent</Text>
        <Text style={styles.opponentName}>{debate?.opponent_id ? 'Opponent' : 'Waiting...'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.startButton, micPermission !== 'granted' && styles.startButtonDisabled]}
        onPress={handleStart}
        disabled={micPermission !== 'granted'}
      >
        <Text style={styles.startButtonText}>Start Debate</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heading: { fontFamily: 'DM Serif Display', fontSize: 28, color: COLORS.textPrimary, marginBottom: 8 },
  topicTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 32, textAlign: 'center' },
  rulesCard: { backgroundColor: COLORS.bgSurface, borderRadius: 16, padding: 20, width: '100%', marginBottom: 24 },
  ruleRow: { flexDirection: 'row', paddingVertical: 12 },
  ruleRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  ruleNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accentAmber, color: COLORS.bgPrimary, fontWeight: '700', textAlign: 'center', lineHeight: 28, marginRight: 12 },
  ruleBody: { flex: 1 },
  ruleName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  rulePrompt: { fontSize: 14, color: COLORS.textSecondary },
  tagline: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 32 },
  micCard: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, width: '100%', marginBottom: 16, alignItems: 'center' },
  micTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  micBody: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
  micButton: { backgroundColor: COLORS.accentAmber, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  micButtonText: { color: COLORS.bgPrimary, fontWeight: '700' },
  micOkDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.successGreen, marginBottom: 8 },
  micOkText: { fontSize: 14, color: COLORS.successGreen, fontWeight: '700' },
  opponentCard: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, width: '100%', marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  opponentLabel: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase' },
  opponentName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  startButton: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', height: 56, justifyContent: 'center' },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
})
