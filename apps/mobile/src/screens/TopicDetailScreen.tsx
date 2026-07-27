import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Share } from 'react-native'
import { CaretLeft, ShareNetwork } from 'phosphor-react-native'
import type { Topic, Debate } from '@squabble-up/shared'
import { getTopicByIdentifier } from '../lib/topics'
import { getDebates } from '../lib/debates'
import type { ScreenProps } from '../lib/types'
import { COLORS } from '../lib/design'

export default function TopicDetailScreen({ route, navigation }: ScreenProps<'TopicDetail'>) {
  const { slug } = route.params
  const [topic, setTopic] = useState<Topic | null>(null)
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const topicResult = await getTopicByIdentifier(slug)
        if (!topicResult.success) throw new Error('Topic not found')
        if (!cancelled) setTopic(topicResult.data)

        const debatesResult = await getDebates({ topic_id: topicResult.data.id, status: 'completed', limit: 10 })
        if (!cancelled && debatesResult.success && debatesResult.data) {
          setDebates(debatesResult.data)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [slug])

  const handleShare = async () => {
    if (!topic) return
    try {
      await Share.share({ message: `Debate "${topic.title}" on Squabble Up: squabbleup://topic/${topic.slug}` })
    } catch { /* cancelled */ }
  }

  const handleDebateThis = () => {
    if (!topic) return
    navigation.navigate('CreateDebate', { preselectedTopicId: topic.id })
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accentAmber} />
      </View>
    )
  }

  if (error || !topic) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Topic not found</Text>
        <Text style={styles.errorBody}>It may have been removed.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Browse Topics</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CaretLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{topic.title}</Text>
        <TouchableOpacity onPress={handleShare}>
          <ShareNetwork color={COLORS.textPrimary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.hero}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{topic.category}</Text>
          </View>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.meta}>Suggested by {topic.created_by ? `@user` : 'Squabble Up'} • {new Date(topic.created_at).toLocaleDateString()}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{topic.debate_count}</Text>
              <Text style={styles.statLabel}>debates</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.debateButton} onPress={handleDebateThis}>
          <Text style={styles.debateButtonText}>Debate This</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Past Debates</Text>
        {debates.length === 0 ? (
          <View style={styles.emptyPast}>
            <Text style={styles.emptyTitle}>Be the first to debate this topic!</Text>
            <Text style={styles.emptyBody}>Tap "Debate This" above to start.</Text>
          </View>
        ) : (
          debates.map(debate => (
            <TouchableOpacity
              key={debate.id}
              style={styles.debateCard}
              onPress={() => navigation.navigate('Verdict', { debateId: debate.id })}
            >
              <Text style={styles.debateCardStatus}>{debate.status.toUpperCase()}</Text>
              <Text style={styles.debateCardDate}>{debate.completed_at ? new Date(debate.completed_at).toLocaleDateString() : 'In progress'}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bgElevated, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, height: 56 },
  topBarTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginHorizontal: 16 },
  content: { flex: 1 },
  contentInner: { padding: 24, paddingBottom: 48 },
  hero: { backgroundColor: COLORS.bgSurface, borderRadius: 16, padding: 24, marginBottom: 24 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.bgElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  categoryText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  topicTitle: { fontFamily: 'DM Serif Display', fontSize: 28, color: COLORS.textPrimary, marginBottom: 8, lineHeight: 36 },
  meta: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statPill: { flex: 1, backgroundColor: COLORS.bgElevated, borderRadius: 8, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  debateButton: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32, height: 56, justifyContent: 'center' },
  debateButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontFamily: 'DM Serif Display', fontSize: 22, color: COLORS.textPrimary, marginBottom: 16 },
  emptyPast: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyTitle: { fontFamily: 'DM Serif Display', fontSize: 18, color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  debateCard: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  debateCardStatus: { fontSize: 12, fontWeight: '700', color: COLORS.accentAmber, textTransform: 'uppercase' },
  debateCardDate: { fontSize: 12, color: COLORS.textMuted },
  errorTitle: { fontFamily: 'DM Serif Display', fontSize: 22, color: COLORS.textPrimary, marginBottom: 8 },
  errorBody: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  backText: { fontSize: 16, color: COLORS.accentAmber, fontWeight: '700' },
})
