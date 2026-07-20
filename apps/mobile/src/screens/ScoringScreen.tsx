import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native'
import ViewShot from 'react-native-view-shot'
import { getScorecard } from '../lib/debates'
import { ROUND_DURATIONS, ROUND_NUMBER_TO_TYPE } from '@squabble-up/shared'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<{ Scoring: { debateId: string } }, 'Scoring'>

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

const CATEGORIES = ['logic', 'persuasiveness', 'evidence', 'delivery'] as const

export default function ScoringScreen({ route, navigation }: Props) {
  const { debateId } = route.params
  const [scorecard, setScorecard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    const fetchScorecard = async () => {
      try {
        const result = await getScorecard(debateId)
        if (!cancelled && result.success) {
          setScorecard(result.data)
        }
      } catch {
        if (!cancelled) setError('Could not load scorecard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchScorecard()
    return () => { cancelled = true }
  }, [debateId])

  const handleShare = async () => {
    try {
      const uri = await cardRef.current?.capture()
      if (uri) {
        await Share.share({
          message: `I just debated "${scorecard?.topic?.title}" on Squabble Up! Debate me: squabbleup://debate/${debateId}`,
          url: uri,
        })
      }
    } catch {
      // Share cancelled
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accentAmber} />
        <Text style={styles.loadingText}>Loading scorecard...</Text>
      </View>
    )
  }

  if (error || !scorecard) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'No scorecard available.'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const winner = scorecard.winner_id === scorecard.creator_id ? 'Creator' : 'Opponent'

  return (
    <View style={styles.container}>
      <ViewShot ref={cardRef} options={{ format: 'png', quality: 0.9 }} style={styles.card}>
        <Text style={styles.wordmark}>Squabble Up</Text>
        <Text style={styles.tagline}>Your opinion, scored.</Text>

        <Text style={styles.topicTitle}>{scorecard.topic?.title || 'Debate'}</Text>
        <Text style={styles.date}>{new Date(scorecard.completed_at).toLocaleDateString()}</Text>

        <View style={styles.divider} />

        <View style={styles.participants}>
          <View style={styles.participant}>
            <Text style={styles.participantName}>Creator</Text>
            <Text style={styles.participantSide}>FOR</Text>
          </View>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.participant}>
            <Text style={styles.participantName}>Opponent</Text>
            <Text style={styles.participantSide}>AGAINST</Text>
          </View>
        </View>

        <Text style={styles.winnerText}>{winner} wins!</Text>

        <View style={styles.scoresContainer}>
          {CATEGORIES.map(cat => (
            <View key={cat} style={styles.scoreRow}>
              <Text style={styles.categoryLabel}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { width: '50%', backgroundColor: COLORS.accentAmber }]} />
                <View style={[styles.bar, { width: '50%', backgroundColor: COLORS.textMuted }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.communitySection}>
          <Text style={styles.communityTitle}>Community Vote</Text>
          <View style={styles.splitBar}>
            <View style={[styles.splitBarFill, { width: '60%', backgroundColor: COLORS.accentAmber }]} />
            <View style={[styles.splitBarFill, { width: '40%', backgroundColor: COLORS.textMuted }]} />
          </View>
          <View style={styles.splitLabels}>
            <Text style={styles.splitLabel}>FOR: 60%</Text>
            <Text style={styles.splitLabel}>AGAINST: 40%</Text>
          </View>
        </View>

        <Text style={styles.footer}>Debate anything. Fairly scored.</Text>
        <Text style={styles.url}>squabbleup.app</Text>
      </ViewShot>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Score Card</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, padding: 24, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: COLORS.bgSurface, borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' },
  wordmark: { fontFamily: 'serif', fontSize: 20, fontWeight: '700', color: COLORS.accentAmber, marginBottom: 4 },
  tagline: { fontSize: 12, color: COLORS.textMuted, marginBottom: 24 },
  topicTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  date: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },
  divider: { width: '100%', height: 1, backgroundColor: COLORS.borderSubtle, marginBottom: 16 },
  participants: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 24 },
  participant: { alignItems: 'center' },
  participantName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  participantSide: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  vsCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.accentAmber, alignItems: 'center', justifyContent: 'center' },
  vsText: { fontFamily: 'serif', fontSize: 16, fontWeight: '800', color: COLORS.bgPrimary },
  winnerText: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: COLORS.accentAmber, marginBottom: 24 },
  scoresContainer: { width: '100%', marginBottom: 24 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  categoryLabel: { width: 100, fontSize: 14, color: COLORS.textSecondary },
  barContainer: { flex: 1, flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%' },
  footer: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 4 },
  url: { fontSize: 12, color: COLORS.textSecondary },
  actions: { marginTop: 24, alignItems: 'center', gap: 16 },
  shareButton: { backgroundColor: COLORS.accentAmber, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  shareButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
  doneText: { color: COLORS.textSecondary, fontSize: 16 },
  loadingText: { color: COLORS.textSecondary, marginTop: 16 },
  errorText: { color: COLORS.recordRed, fontSize: 16, marginBottom: 16 },
  backText: { color: COLORS.accentAmber, fontSize: 16 },
  communitySection: { width: '100%', marginBottom: 24, backgroundColor: COLORS.bgElevated, padding: 16, borderRadius: 12 },
  communityTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 12 },
  splitBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  splitBarFill: { height: '100%' },
  splitLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  splitLabel: { fontSize: 12, color: COLORS.textMuted },
})
