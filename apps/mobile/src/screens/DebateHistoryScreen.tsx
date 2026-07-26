import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
import { getUserHistory } from '../lib/users'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/types'

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

type LocalStackParamList = RootStackParamList & {
  DebateHistory: { userId: string }
}

type Props = NativeStackScreenProps<LocalStackParamList, 'DebateHistory'>

type FilterOption = 'all' | 'won' | 'lost' | 'tied'

interface HistoryDebate {
  id: string
  topic_id?: string
  topic_title?: string
  opponent_side?: string
  result: 'won' | 'lost' | 'tied'
  score?: string
  completed_at: string | null
  is_creator?: boolean
}

const FILTER_OPTIONS: FilterOption[] = ['all', 'won', 'lost', 'tied']

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All',
  won: 'Won',
  lost: 'Lost',
  tied: 'Tied',
}

export default function DebateHistoryScreen({ navigation, route }: Props) {
  const { userId } = route.params
  const [history, setHistory] = useState<HistoryDebate[]>([])
  const [filter, setFilter] = useState<FilterOption>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await getUserHistory(userId, { page: 1, limit: 50 })
        if (!cancelled) setHistory(res.data || [])
      } catch {
        if (!cancelled) setHistory([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const filtered = filter === 'all' ? history : history.filter((item) => item.result === filter)

  const renderItem = ({ item }: { item: HistoryDebate }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Scoring', { debateId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.topic}>{item.topic_title ?? 'Debate'}</Text>
        <View
          style={[
            styles.badge,
            item.result === 'won' && styles.badgeWon,
            item.result === 'lost' && styles.badgeLost,
            item.result === 'tied' && styles.badgeTied,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              item.result === 'won' && styles.badgeTextWon,
              item.result === 'lost' && styles.badgeTextLost,
              item.result === 'tied' && styles.badgeTextTied,
            ]}
          >
            {item.result.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.opponent}>vs {item.opponent_side ?? 'Opponent'}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.score}>Score: {item.score ?? '—'}</Text>
        <Text style={styles.date}>
          {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : '—'}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarSide} onPress={() => navigation.goBack()}>
          <CaretLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Debates</Text>
        <View style={styles.topBarSide} />
      </View>

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterButton, filter === option && styles.filterButtonActive]}
            onPress={() => setFilter(option)}
          >
            <Text style={[styles.filterText, filter === option && styles.filterTextActive]}>
              {FILTER_LABELS[option]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.accentAmber} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Your debate history will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 12,
  },
  topBarSide: { width: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: {
    flex: 1,
    fontFamily: 'DM Serif Display',
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: { backgroundColor: COLORS.accentAmber },
  filterText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.bgPrimary },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topic: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 12,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.bgElevated },
  badgeWon: { backgroundColor: 'rgba(102,187,106,0.2)' },
  badgeLost: { backgroundColor: 'rgba(229,57,53,0.2)' },
  badgeTied: { backgroundColor: 'rgba(107,101,96,0.2)' },
  badgeText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  badgeTextWon: { color: COLORS.successGreen },
  badgeTextLost: { color: COLORS.recordRed },
  badgeTextTied: { color: COLORS.textSecondary },
  opponent: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  score: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  date: { fontSize: 12, color: COLORS.textMuted },
  emptyState: { alignItems: 'center', marginTop: 64, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
})
