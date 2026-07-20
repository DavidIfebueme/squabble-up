import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import type { Debate, DebateStatus } from '@squabble-up/shared'
import { getOpenDebates } from '../lib/debates'

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  bgElevated: '#333333',
  accentAmber: '#D4953A',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  borderSubtle: '#3A3A3A',
  statusPending: '#D4953A',
  statusActive: '#4CAF50',
  statusCompleted: '#6B6560',
}

const STATUS_LABELS: Record<DebateStatus, string> = {
  pending: 'OPEN',
  active: 'LIVE',
  completed: 'DONE',
  abandoned: 'ABANDONED',
  scoring_failed: 'ERROR',
}

export default function DebateScreen({ navigation }: any) {
  const [debates, setDebates] = useState<Debate[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchDebates = useCallback(async () => {
    try {
      setError(false)
      const result = await getOpenDebates({ limit: 20 })
      if (result.success && result.data) setDebates(result.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDebates()
  }, [fetchDebates])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchDebates()
  }, [fetchDebates])

  const getStatusColor = (status: DebateStatus) => {
    switch (status) {
      case 'pending': return COLORS.statusPending
      case 'active': return COLORS.statusActive
      case 'completed': return COLORS.statusCompleted
      default: return COLORS.textMuted
    }
  }

  const renderDebate = ({ item }: { item: Debate }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
        </View>
        <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.debateId}>Debate #{item.id.slice(0, 8)}</Text>
      <View style={styles.row}>
        <Text style={styles.participants}>
          {[item.creator_id, item.opponent_id].filter(Boolean).length}/2 participants
        </Text>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => navigation.navigate('DebateLobby', { debateId: item.id })}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.header}>Open Debates</Text>
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonBadge} />
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonMeta} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Couldn't load debates.</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={[styles.emptyBody, { color: COLORS.accentAmber }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={debates}
          keyExtractor={(item) => item.id}
          renderItem={renderDebate}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentAmber} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No open debates</Text>
              <Text style={styles.emptyBody}>Create one or check back later.</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: { backgroundColor: COLORS.bgElevated, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, height: 56, justifyContent: 'center' },
  header: { fontFamily: 'serif', fontSize: 20, fontWeight: '400', color: COLORS.textPrimary },
  listContent: { padding: 16 },
  card: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: COLORS.bgPrimary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  time: { color: COLORS.textMuted, fontSize: 12 },
  debateId: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participants: { fontSize: 12, color: COLORS.textSecondary },
  joinButton: { backgroundColor: COLORS.accentAmber, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  joinButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 14 },
  skeletonContainer: { padding: 16 },
  skeletonCard: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, marginBottom: 12, opacity: 0.4 },
  skeletonBadge: { width: 50, height: 16, backgroundColor: COLORS.borderSubtle, borderRadius: 6, marginBottom: 8 },
  skeletonTitle: { width: '70%', height: 18, backgroundColor: COLORS.borderSubtle, borderRadius: 4, marginBottom: 8 },
  skeletonMeta: { width: '40%', height: 14, backgroundColor: COLORS.borderSubtle, borderRadius: 4 },
  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyTitle: { fontFamily: 'serif', fontSize: 22, color: COLORS.textPrimary, marginBottom: 8 },
  emptyBody: { fontSize: 16, color: COLORS.textSecondary },
})
