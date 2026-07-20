import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import type { Topic } from '@squabble-up/shared'
import { getTopics } from '../lib/topics'

const CATEGORIES = ['All', 'Politics', 'Tech', 'Sports', 'Philosophy', 'Pop Culture', 'Science', 'Ethics', 'Food', 'Music', 'Gaming']

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  bgElevated: '#333333',
  accentAmber: '#D4953A',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  borderSubtle: '#3A3A3A',
}

export default function HomeScreen({ navigation }: any) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(false)

  const fetchTopics = useCallback(async (pageNum = 1, append = false) => {
    try {
      setError(false)
      const category = selectedCategory === 'All' ? undefined : selectedCategory
      const result = await getTopics({ category, page: pageNum, limit: 20 })
      if (result.success && result.data) {
        setTopics(prev => append ? [...prev, ...result.data!] : result.data!)
        setHasMore(result.has_more)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    setLoading(true)
    setPage(1)
    fetchTopics(1, false)
  }, [selectedCategory, fetchTopics])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setPage(1)
    fetchTopics(1, false)
  }, [fetchTopics])

  const onEndReached = useCallback(() => {
    if (hasMore && !refreshing) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchTopics(nextPage, true)
    }
  }, [hasMore, refreshing, page, fetchTopics])

  const renderCategoryChip = ({ item }: { item: string }) => {
    const isSelected = item === selectedCategory
    return (
      <TouchableOpacity
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setSelectedCategory(item)}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{item}</Text>
      </TouchableOpacity>
    )
  }

  const renderTopic = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TopicDetail', { slug: item.slug })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.topicTitle}>{item.title}</Text>
      <Text style={styles.topicMeta}>{item.debate_count} debates</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>Squabble Up</Text>
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        renderItem={renderCategoryChip}
        style={styles.chipList}
        showsHorizontalScrollIndicator={false}
      />

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
          <Text style={styles.emptyTitle}>Couldn't load feed.</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={[styles.emptyBody, { color: COLORS.accentAmber }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          renderItem={renderTopic}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentAmber} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No debates yet?</Text>
              <Text style={styles.emptyBody}>Pick a topic and start one.</Text>
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
  wordmark: { fontFamily: 'serif', fontSize: 20, fontWeight: '400', color: COLORS.textPrimary },
  chipList: { maxHeight: 48, paddingHorizontal: 16, paddingVertical: 8 },
  chip: { backgroundColor: COLORS.bgSurface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 8, height: 36, justifyContent: 'center' },
  chipSelected: { backgroundColor: COLORS.accentAmber },
  chipText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '400' },
  chipTextSelected: { color: COLORS.bgPrimary, fontWeight: '600' },
  listContent: { padding: 16 },
  card: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: { backgroundColor: COLORS.bgElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { color: COLORS.textSecondary, fontSize: 12 },
  topicTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  topicMeta: { fontSize: 12, color: COLORS.textSecondary },
  skeletonContainer: { padding: 16 },
  skeletonCard: { backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 16, marginBottom: 12, opacity: 0.4 },
  skeletonBadge: { width: 60, height: 16, backgroundColor: COLORS.borderSubtle, borderRadius: 4, marginBottom: 8 },
  skeletonTitle: { width: '80%', height: 18, backgroundColor: COLORS.borderSubtle, borderRadius: 4, marginBottom: 8 },
  skeletonMeta: { width: '40%', height: 14, backgroundColor: COLORS.borderSubtle, borderRadius: 4 },
  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyTitle: { fontFamily: 'serif', fontSize: 22, color: COLORS.textPrimary, marginBottom: 8 },
  emptyBody: { fontSize: 16, color: COLORS.textSecondary },
})
