import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import VoiceRecorder from '../components/VoiceRecorder'
import { createRound, updateRound } from '../lib/rounds'
import { getDebate } from '../lib/debates'
import { joinDebateRoom, leaveDebateRoom, onDebateEvent, startHeartbeat } from '../lib/socket'
import { ROUND_DURATIONS, ROUND_NUMBER_TO_TYPE } from '@squabble-up/shared'
import type { ScreenProps } from '../lib/types'

type Props = ScreenProps<'DebateRound'>

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
  const [opponentDisconnected, setOpponentDisconnected] = useState(false)
  const [reconnectRemaining, setReconnectRemaining] = useState<number | null>(null)
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

        if (!cancelled) {
          const d = result.data
          setOpponentId(side === 'creator' ? d.opponent_id : d.creator_id)
        }

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
    joinDebateRoom(debateId)
    startHeartbeat(debateId)
    return () => { leaveDebateRoom(debateId) }
  }, [debateId])

  useEffect(() => {
    const cleanup1 = onDebateEvent('round-started', (data) => {
      if (data.payload?.round_number === roundNumber && data.payload?.speaker_id !== undefined) {
        if (data.payload.speaker_id !== opponentId) return
        setOpponentStatus('recording')
      }
    })
    const cleanup2 = onDebateEvent('round-submitted', (data) => {
      if (data.payload?.round_number === roundNumber) {
        if (data.payload?.speaker_id !== undefined && data.payload.speaker_id !== opponentId) return
        setOpponentStatus('done')
      }
    })
    const cleanup3 = onDebateEvent('opponent-disconnected', () => {
      setOpponentDisconnected(true)
      setReconnectRemaining(120)
    })
    const cleanup4 = onDebateEvent('opponent-reconnected', () => {
      setOpponentDisconnected(false)
      setReconnectRemaining(null)
      setOpponentStatus('waiting')
    })
    const cleanup5 = onDebateEvent('reconnect-window', (data) => {
      const remaining = data.remaining_ms ?? 0
      setReconnectRemaining(Math.ceil(remaining / 1000))
    })
    const cleanup6 = onDebateEvent('debate-completed', () => {
      navigation.replace('Scoring', { debateId })
    })
    const cleanup7 = onDebateEvent('debate-abandoned', () => {
      Alert.alert('Debate Abandoned', 'Your opponent did not reconnect in time. You win by default.', [
        { text: 'OK', onPress: () => navigation.replace('Scoring', { debateId }) },
      ])
    })
    const cleanup8 = onDebateEvent('user-left', () => {
      setOpponentDisconnected(true)
      setReconnectRemaining(120)
    })

    return () => {
      cleanup1()
      cleanup2()
      cleanup3()
      cleanup4()
      cleanup5()
      cleanup6()
      cleanup7()
      cleanup8()
    }
  }, [debateId, roundNumber, navigation, opponentId])

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

  const opponentStatusText = opponentDisconnected
    ? reconnectRemaining !== null
      ? `Opponent disconnected. Waiting for them to return... ${Math.floor(reconnectRemaining / 60)}:${String(reconnectRemaining % 60).padStart(2, '0')}`
      : 'Opponent disconnected. Waiting...'
    : opponentStatus === 'recording' ? 'Opponent: Recording...'
    : opponentStatus === 'done' ? 'Opponent: Done'
    : 'Opponent: Waiting...'

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
        <Text style={styles.opponentLabel}>{opponentStatusText}</Text>
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
