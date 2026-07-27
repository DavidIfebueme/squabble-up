import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Share } from 'react-native'
import { getScorecard, ScorecardData } from '../lib/debates'
import type { ScreenProps } from '../lib/types'
import { COLORS } from '../lib/design'

const CATEGORIES = ['logic', 'persuasiveness', 'evidence', 'delivery'] as const

export default function VerdictScreen({ route, navigation }: ScreenProps<'Verdict'>) {
  const { debateId } = route.params
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const result = await getScorecard(debateId)
        if (!cancelled && result.success) {
          setScorecard(result.data)
        }
      } catch {
        if (!cancelled) setError('Could not load verdict.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [debateId])

  useEffect(() => {
    if (!loading && scorecard) {
      Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }, [loading, scorecard, scaleAnim])

  const handleShare = async () => {
    if (!scorecard) return
    try {
      await Share.share({ message: `I just debated "${scorecard.topic?.title}" on Squabble Up! ${winnerLabel} wins! Debate me: squabbleup://debate/${debateId}` })
    } catch { /* cancelled */ }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accentAmber} />
        <Text style={styles.loadingText}>Loading verdict...</Text>
      </View>
    )
  }

  if (error || !scorecard) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'No verdict available.'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const creatorScore = scorecard.ai_scores?.creator
    ? Object.values(scorecard.ai_scores.creator).reduce((a, b) => a + b, 0) / 4
    : 0
  const opponentScore = scorecard.ai_scores?.opponent
    ? Object.values(scorecard.ai_scores.opponent).reduce((a, b) => a + b, 0) / 4
    : 0

  const isTie = creatorScore === opponentScore
  const isCreatorWinner = scorecard.winner_id === scorecard.creator_id
  const winnerName = isCreatorWinner ? 'Creator' : 'Opponent'
  const winnerScore = isCreatorWinner ? creatorScore : opponentScore
  const loserScore = isCreatorWinner ? opponentScore : creatorScore
  const winnerLabel = isTie ? 'Too close to call' : winnerName

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.verdictLabel}>VERDICT</Text>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.winnerName}>{winnerLabel}</Text>
        {!isTie && <Text style={styles.winsText}>WINS</Text>}
      </Animated.View>

      <Text style={styles.scoreText}>{Math.round(winnerScore)} – {Math.round(loserScore)}</Text>

      <View style={styles.participants}>
        <View style={[styles.participantCard, isCreatorWinner && styles.winnerCard]}>
          <Text style={styles.participantName}>Creator</Text>
          <Text style={styles.participantSide}>FOR</Text>
          <Text style={styles.participantScore}>{Math.round(creatorScore)}</Text>
          {isCreatorWinner && <Text style={styles.winnerBadge}>WINNER</Text>}
        </View>

        <View style={[styles.participantCard, !isCreatorWinner && !isTie && styles.winnerCard]}>
          <Text style={styles.participantName}>Opponent</Text>
          <Text style={styles.participantSide}>AGAINST</Text>
          <Text style={styles.participantScore}>{Math.round(opponentScore)}</Text>
          {!isCreatorWinner && !isTie && <Text style={styles.winnerBadge}>WINNER</Text>}
        </View>
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Score Breakdown</Text>
        {CATEGORIES.map(cat => {
          const creatorCat = scorecard.ai_scores?.creator?.[cat] ?? 0
          const opponentCat = scorecard.ai_scores?.opponent?.[cat] ?? 0
          return (
            <View key={cat} style={styles.scoreRow}>
              <Text style={styles.categoryLabel}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${creatorCat}%`, backgroundColor: COLORS.accentAmber }]} />
                <View style={[styles.bar, { width: `${opponentCat}%`, backgroundColor: COLORS.textMuted }]} />
              </View>
              <Text style={styles.categoryScores}>{creatorCat} – {opponentCat}</Text>
            </View>
          )
        })}
      </View>

      {scorecard.ai_scores?.reasoning && (
        <View style={styles.reasoningCard}>
          <Text style={styles.reasoningText}>"{scorecard.ai_scores.reasoning}"</Text>
        </View>
      )}

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Share Score Card</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.replace('Scoring', { debateId })}>
        <Text style={styles.viewFullText}>View Full Score Card</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Main')}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { alignItems: 'center', padding: 24, paddingBottom: 48 },
  verdictLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 3, marginTop: 48, marginBottom: 16 },
  winnerName: { fontFamily: 'DM Serif Display', fontSize: 36, color: COLORS.accentAmber, textAlign: 'center' },
  winsText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  scoreText: { fontFamily: 'DM Serif Display', fontSize: 64, color: COLORS.accentAmber, marginVertical: 24 },
  participants: { flexDirection: 'row', gap: 16, marginBottom: 32, width: '100%' },
  participantCard: { flex: 1, backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, alignItems: 'center' },
  winnerCard: { backgroundColor: COLORS.bgElevated, borderTopWidth: 3, borderTopColor: COLORS.accentAmber },
  participantName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  participantSide: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  participantScore: { fontFamily: 'DM Serif Display', fontSize: 28, color: COLORS.accentAmber, marginTop: 8 },
  winnerBadge: { fontSize: 10, fontWeight: '700', color: COLORS.bgPrimary, backgroundColor: COLORS.accentAmber, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 8 },
  breakdownCard: { backgroundColor: COLORS.bgSurface, borderRadius: 16, padding: 20, width: '100%', marginBottom: 24 },
  breakdownTitle: { fontFamily: 'DM Serif Display', fontSize: 18, color: COLORS.textPrimary, marginBottom: 16 },
  scoreRow: { marginBottom: 12 },
  categoryLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textTransform: 'capitalize' },
  barContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  bar: { height: '100%' },
  categoryScores: { fontSize: 12, color: COLORS.textMuted, textAlign: 'right' },
  reasoningCard: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, width: '100%', marginBottom: 24 },
  reasoningText: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 20 },
  shareButton: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 16, height: 56, justifyContent: 'center' },
  shareButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
  viewFullText: { fontSize: 16, color: COLORS.accentAmber, marginBottom: 16 },
  doneText: { fontSize: 16, color: COLORS.textSecondary },
  loadingText: { color: COLORS.textSecondary, marginTop: 16 },
  errorText: { color: COLORS.recordRed, fontSize: 16, marginBottom: 16 },
  backText: { color: COLORS.accentAmber, fontSize: 16 },
})
