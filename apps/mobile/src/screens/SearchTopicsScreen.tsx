import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import type { Topic } from '@squabble-up/shared'
import { getTopics } from '../lib/topics'
import type { ScreenProps } from '../lib/types'
import { COLORS } from '../lib/design'

export default function SearchTopicsScreen({ navigation }: ScreenProps<'SearchTopics'>) {
  const [query, setQuery] = useState('')
  const [allTopics, setAllTopics] = useState<Topic[]>([])
  const [filtered, setFiltered] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setError(false)
        const result = await getTopics({ limit: 100 })
        if (result.success && result.data) {
          setAllTopics(result.data)
          setFiltered(result.data)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    void fetchTopics()
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const normalized = query.trim().toLowerCase()
      if (!normalized) {
        setFiltered(allTopics)
        return
      }

      const next = allTopics.filter(
        topic =>
          topic.title.toLowerCase().includes(normalized) ||
          topic.description.toLowerCase().includes(normalized)
      )
      setFiltered(next)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, allTopics])

  const handleSubmitSearch = useCallback(() => {
    const normalized = query.trim()
    if (!normalized) return

    setRecentSearches(prev => {
      const next = [normalized, ...prev.filter(item => item !== normalized)]
      return next.slice(0, 10)
    })
  }, [query])

  const handleRecentPress = useCallback((search: string) => {
    setQuery(search)
  }, [])

  const handleClearRecents = useCallback(() => {
    setRecentSearches([])
  }, [])

  const handleSuggestTopic = useCallback(() => {
    // TopicSuggestion will be wired into RootStackParamList by the navigation agent.
    const navigate = navigation.navigate as unknown as (name: string, params?: object) => void
    navigate('TopicSuggestion', { query: query.trim() })
  }, [navigation, query])

  const renderTopic = useCallback(
    ({ item }: { item: Topic }) => (
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => navigation.navigate('TopicDetail', { slug: item.slug })}
      >
        <View style={styles.rowHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.debateCount}>{item.debate_count} debates</Text>
        </View>
        <Text style={styles.topicTitle}>{item.title}</Text>
      </TouchableOpacity>
    ),
    [navigation]
  )

  const renderRecentChip = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity style={styles.recentChip} onPress={() => handleRecentPress(item)}>
        <Text style={styles.recentChipText}>{item}</Text>
      </TouchableOpacity>
    ),
    [handleRecentPress]
  )

  const keyExtractorTopic = useCallback((item: Topic) => item.id, [])
  const keyExtractorSearch = useCallback((item: string) => item, [])

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmitSearch}
          autoFocus
          returnKeyType="search"
        />
      </View>

      {recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent searches</Text>
            <TouchableOpacity onPress={handleClearRecents}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={recentSearches}
            keyExtractor={keyExtractorSearch}
            renderItem={renderRecentChip}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accentAmber} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Couldn’t load topics.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.emptyLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractorTopic}
          renderItem={renderTopic}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No topics found for &apos;{query.trim()}&apos;.</Text>
              <TouchableOpacity style={styles.suggestButton} onPress={handleSuggestTopic}>
                <Text style={styles.suggestButtonText}>Suggest this topic</Text>
              </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    height: 56,
    gap: 12,
  },
  backArrow: { fontSize: 24, color: COLORS.textPrimary },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 16,
  },
  recentSection: { paddingTop: 12 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  clearText: { fontSize: 14, color: COLORS.accentAmber, fontWeight: '600' },
  recentList: { paddingHorizontal: 16, gap: 8 },
  recentChip: {
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  recentChipText: { color: COLORS.textPrimary, fontSize: 14 },
  listContent: { padding: 16 },
  resultRow: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  topicTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  debateCount: { fontSize: 12, color: COLORS.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyTitle: { fontFamily: 'DM Serif Display', fontSize: 22, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 16 },
  emptyLink: { fontSize: 16, color: COLORS.accentAmber, fontWeight: '700', marginTop: 8 },
  suggestButton: {
    backgroundColor: COLORS.accentAmber,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  suggestButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
})
