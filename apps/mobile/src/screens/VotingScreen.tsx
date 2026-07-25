import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { getDebate, triggerScoring } from '../lib/debates'
import { getRoundsByDebate } from '../lib/rounds'
import { submitVote } from '../lib/votes'
import type { ScreenProps } from '../lib/types'

interface Debate {
  id: string
  topic_id: string
  status: string
}

interface Round {
  id: string
  round_number: number
  transcription: string | null
}

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  bgElevated: '#333333',
  accentAmber: '#D4953A',
  recordRed: '#E53935',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  borderSubtle: '#3A3A3A',
  successGreen: '#66BB6A',
}

const ROUND_NAMES = ['Opening', 'Rebuttal', 'Closing']

export default function VotingScreen({ route, navigation }: ScreenProps<'Voting'>) {
  const { debateId } = route.params
  const [debate, setDebate] = useState<Debate | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWinner, setSelectedWinner] = useState<'creator' | 'opponent' | null>(null)
  const [expandedRound, setExpandedRound] = useState<string | null>(null)
  const [scoring, setScoring] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [debateRes, roundsRes] = await Promise.all([
          getDebate(debateId),
          getRoundsByDebate(debateId),
        ])
        if (!cancelled) {
          setDebate(debateRes.data)
          setRounds(roundsRes.data || [])
        }
      } catch {
        Alert.alert('Error', 'Could not load debate.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [debateId])

  const handleScoring = async () => {
    setScoring(true)
    try {
      if (selectedWinner) {
        try {
          await submitVote({
            debate_id: debateId,
            vote_type: selectedWinner,
            logic_score: 5,
            evidence_score: 5,
            delivery_score: 5,
          })
        } catch {
          // Vote submission is optional — continue to scoring
        }
      }
      await triggerScoring(debateId)
      navigation.replace('Scoring', { debateId })
    } catch {
      Alert.alert('Error', 'Could not start scoring.')
    } finally {
      setScoring(false)
    }
  }

  if (loading) {
    return <View style={styles.container}><Text style={styles.loadingText}>Loading...</Text></View>
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Debate Complete</Text>

      {debate?.topic_id && (
        <View style={styles.topicCard}>
          <Text style={styles.topicTitle}>Debate</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Review the arguments</Text>

      {ROUND_NAMES.map((name, i) => {
        const round = rounds.find(r => r.round_number === i + 1)
        const key = `round-${i + 1}`
        const isExpanded = expandedRound === key

        return (
          <TouchableOpacity
            key={key}
            style={styles.roundCard}
            onPress={() => setExpandedRound(isExpanded ? null : key)}
          >
            <View style={styles.roundHeader}>
              <Text style={styles.roundName}>Round {i + 1}: {name}</Text>
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </View>
            {isExpanded && round?.transcription && (
              <Text style={styles.transcript}>{round.transcription}</Text>
            )}
          </TouchableOpacity>
        )
      })}

      <Text style={styles.sectionTitle}>Who won?</Text>

      <View style={styles.winnerPicker}>
        <TouchableOpacity
          style={[styles.winnerCard, selectedWinner === 'creator' && styles.winnerCardSelected]}
          onPress={() => setSelectedWinner('creator')}
        >
          <Text style={[styles.winnerLabel, selectedWinner === 'creator' && styles.winnerLabelSelected]}>FOR</Text>
          <Text style={styles.winnerName}>Creator</Text>
          {selectedWinner === 'creator' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.winnerCard, selectedWinner === 'opponent' && styles.winnerCardSelected]}
          onPress={() => setSelectedWinner('opponent')}
        >
          <Text style={[styles.winnerLabel, selectedWinner === 'opponent' && styles.winnerLabelSelected]}>AGAINST</Text>
          <Text style={styles.winnerName}>Opponent</Text>
          {selectedWinner === 'opponent' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (!selectedWinner || scoring) && styles.submitButtonDisabled]}
        onPress={handleScoring}
        disabled={!selectedWinner || scoring}
      >
        <Text style={styles.submitButtonText}>{scoring ? 'Scoring...' : 'Submit & Score'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleScoring}>
        <Text style={styles.skipText}>Skip voting — use AI scoring</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, padding: 24 },
  header: { fontFamily: 'DM Serif Display', fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginTop: 48, marginBottom: 16 },
  topicCard: { backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginBottom: 24 },
  topicTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  roundCard: { backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginBottom: 8 },
  roundHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  expandIcon: { fontSize: 12, color: COLORS.textMuted },
  transcript: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12, lineHeight: 20 },
  winnerPicker: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  winnerCard: { flex: 1, backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  winnerCardSelected: { borderColor: COLORS.accentAmber },
  winnerLabel: { fontSize: 18, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 4 },
  winnerLabelSelected: { color: COLORS.accentAmber },
  winnerName: { fontSize: 14, color: COLORS.textMuted },
  checkmark: { fontSize: 20, fontWeight: '700', color: COLORS.accentAmber, marginTop: 8 },
  submitButton: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
  skipButton: { alignItems: 'center', padding: 12 },
  skipText: { color: COLORS.textSecondary, fontSize: 14 },
  loadingText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 100 },
})
