import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import VoiceRecorder from '../components/VoiceRecorder'
import { createRound, updateRound, getRoundsByDebate } from '../lib/rounds'
import { getDebate } from '../lib/debates'
import { ROUND_DURATIONS, ROUND_NUMBER_TO_TYPE } from '@squabble-up/shared'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  DebateRound: { debateId: string; roundNumber: number; side: 'creator' | 'opponent' }
  DebateLobby: { debateId: string; side?: string }
}

type Props = NativeStackScreenProps<RootStackParamList, 'DebateRound'>

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  accentAmber: '#D4953A',
  recordRed: '#E53935',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  successGreen: '#66BB6A',
}

const ROUND_LABELS: Record<number, { name: string; prompt: string }> = {
  1: { name: 'Opening', prompt: 'State your case.' },
  2: { name: 'Rebuttal', prompt: 'Respond to their points.' },
  3: { name: 'Closing', prompt: 'Make it count.' },
}

export default function DebateRoundScreen({ route, navigation }: Props) {
  const { debateId, roundNumber, side } = route.params
  const label = ROUND_LABELS[roundNumber as keyof typeof ROUND_LABELS] ?? { name: 'Round', prompt: '' }
  const roundType = ROUND_NUMBER_TO_TYPE[roundNumber as keyof typeof ROUND_NUMBER_TO_TYPE]
  const duration = roundType ? ROUND_DURATIONS[roundType] : 90
  const [opponentStatus, setOpponentStatus] = useState<'waiting' | 'recording' | 'done'>('waiting')
  const [roundId, setRoundId] = useState<string | null>(null)
  const [creating, setCreating] = useState(true)
  const [opponentId, setOpponentId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const result = await getDebate(debateId)
        if (!result.success) {
          Alert.alert('Error', 'Could not load debate.')
          navigation.goBack()
          return
        }
        const oppId = side === 'creator' ? result.data.opponent_id : result.data.creator_id
        if (cancelled) return
        setOpponentId(oppId)

        try {
          const roundResult = await createRound(debateId, roundNumber)
          if (!cancelled && roundResult.success) {
            setRoundId(roundResult.data.id)
          }
        } catch {
          if (!cancelled) {
            Alert.alert('Error', 'Could not start round.')
            navigation.goBack()
          }
        } finally {
          if (!cancelled) setCreating(false)
        }
      } catch {
        if (!cancelled) {
          Alert.alert('Error', 'Could not load debate.')
          navigation.goBack()
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [debateId, roundNumber, side, navigation])

  useEffect(() => {
    if (!opponentId) return
    const interval = setInterval(async () => {
      try {
        const result = await getRoundsByDebate(debateId)
        if (result.success) {
          const opponentRound = result.data.find(
            r => r.round_number === roundNumber && r.speaker_id === opponentId
          )
          setOpponentStatus(opponentRound ? 'done' : 'waiting')
        }
      } catch {
        // Network error — keep current status
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [debateId, roundNumber, opponentId])

  const handleRecordComplete = useCallback(async ({ transcription, duration: recordedDuration }: { transcription: string; duration: number }) => {
    if (!roundId) {
      Alert.alert('Error', 'Round not initialized. Please try again.')
      return
    }
    try {
      await updateRound(roundId, { duration: recordedDuration, transcription })
    } catch {
      Alert.alert('Error', 'Failed to save recording. Your audio may not have been saved.')
    }
  }, [roundId])

  const statusDotColor = opponentStatus === 'done' ? COLORS.successGreen
    : opponentStatus === 'recording' ? COLORS.accentAmber
    : COLORS.textMuted

  if (creating) return <View style={styles.container} />

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.roundLabel}>ROUND {roundNumber}</Text>
        <Text style={styles.timerLabel}>{label.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
      </View>

      <VoiceRecorder duration={duration} onComplete={handleRecordComplete} />

      <Text style={styles.prompt}>{label.prompt}</Text>

      <View style={styles.opponentStatus}>
        <Text style={styles.opponentLabel}>
          Opponent: {opponentStatus === 'done' ? 'Done' : 'Waiting...'}
        </Text>
      </View>

      <TouchableOpacity style={styles.leaveButton} onPress={() => navigation.goBack()}>
        <Text style={styles.leaveText}>Leave Debate</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center', padding: 24 },
  statusBar: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 60, left: 24, right: 24 },
  roundLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 2 },
  timerLabel: { flex: 1, textAlign: 'center', fontSize: 14, color: COLORS.textSecondary },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  prompt: { fontFamily: 'serif', fontSize: 16, color: COLORS.textPrimary, marginTop: 24, textAlign: 'center' },
  opponentStatus: { position: 'absolute', bottom: 100 },
  opponentLabel: { fontSize: 14, color: COLORS.textSecondary },
  leaveButton: { position: 'absolute', bottom: 40 },
  leaveText: { fontSize: 14, color: COLORS.textMuted },
})
