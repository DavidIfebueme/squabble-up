import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { getRoundsByDebate } from '../lib/rounds'
import { getDebate } from '../lib/debates'
import { ROUND_NUMBER_TO_TYPE, ROUND_DURATIONS } from '@squabble-up/shared'
import type { ScreenProps } from '../lib/types'

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  accentAmber: '#D4953A',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  successGreen: '#66BB6A',
}

export default function BetweenRoundScreen({ route, navigation }: ScreenProps<'BetweenRound'>) {
  const { debateId, roundNumber, side } = route.params
  const [loading, setLoading] = useState(true)
  const [rounds, setRounds] = useState<{ round_number: number; transcription: string | null; speaker_id: string | null }[]>([])
  const [creatorId, setCreatorId] = useState<string | null>(null)
  const [opponentId, setOpponentId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [debateRes, roundsRes] = await Promise.all([
          getDebate(debateId),
          getRoundsByDebate(debateId),
        ])
        if (!cancelled) {
          if (debateRes.success) {
            setCreatorId(debateRes.data.creator_id)
            setOpponentId(debateRes.data.opponent_id)
          }
          if (roundsRes.success) {
            setRounds(roundsRes.data || [])
          }
        }
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [debateId])

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (roundNumber >= 3) {
        navigation.replace('Voting', { debateId })
      } else {
        navigation.replace('DebateRound', { debateId, roundNumber: roundNumber + 1, side })
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [loading, roundNumber, debateId, side, navigation])

  const type = ROUND_NUMBER_TO_TYPE[roundNumber as keyof typeof ROUND_NUMBER_TO_TYPE]
  const duration = type ? ROUND_DURATIONS[type] : 90
  const nextType = ROUND_NUMBER_TO_TYPE[(roundNumber + 1) as keyof typeof ROUND_NUMBER_TO_TYPE]
  const nextDuration = nextType ? ROUND_DURATIONS[nextType] : 90
  const nextName = nextType ? nextType.charAt(0).toUpperCase() + nextType.slice(1) : 'Round'

  const opponentRound = rounds.find(r => r.round_number === roundNumber && r.speaker_id === (side === 'creator' ? opponentId : creatorId))
  const preview = opponentRound?.transcription?.slice(0, 100)

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accentAmber} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.roundNumber}>ROUND {roundNumber + 1}</Text>
      <Text style={styles.roundName}>{nextName} • {nextDuration}s</Text>
      <Text style={styles.prompt}>Listen to their argument. Now respond.</Text>

      {preview && (
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Their last argument</Text>
          <Text style={styles.previewText}>"{preview}..."</Text>
        </View>
      )}

      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: COLORS.successGreen }]} />
        <Text style={styles.statusText}>You completed Round {roundNumber}</Text>
      </View>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: COLORS.successGreen }]} />
        <Text style={styles.statusText}>Opponent completed Round {roundNumber}</Text>
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={() => {
        if (roundNumber >= 3) {
          navigation.replace('Voting', { debateId })
        } else {
          navigation.replace('DebateRound', { debateId, roundNumber: roundNumber + 1, side })
        }
      }}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center', padding: 24 },
  roundNumber: { fontFamily: 'DM Serif Display', fontSize: 36, color: COLORS.accentAmber, marginBottom: 8 },
  roundName: { fontSize: 16, color: COLORS.textPrimary, marginBottom: 8 },
  prompt: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 32 },
  previewCard: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, width: '100%', marginBottom: 32 },
  previewLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  previewText: { fontSize: 14, color: COLORS.textPrimary, fontStyle: 'italic', lineHeight: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '100%' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  statusText: { fontSize: 14, color: COLORS.textSecondary },
  skipButton: { marginTop: 32, padding: 12 },
  skipText: { fontSize: 16, color: COLORS.accentAmber },
})
