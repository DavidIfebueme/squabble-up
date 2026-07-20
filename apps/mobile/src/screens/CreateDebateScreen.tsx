import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native'
import type { Topic } from '@squabble-up/shared'
import { getTopics } from '../lib/topics'
import { createDebate } from '../lib/debates'

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

export default function CreateDebateScreen({ navigation }: any) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [query, setQuery] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getTopics({ limit: 20 }).then(result => {
      if (result.success && result.data) setTopics(result.data)
    })
  }, [])

  const handleCreate = async () => {
    if (!selectedTopic || creating) return
    setCreating(true)
    try {
      const result = await createDebate({ topic_id: selectedTopic.id })
      if (result.success) {
        navigation.replace('DebateLobby', { debateId: result.data.debate.id })
      }
    } catch {
      Alert.alert('Error', 'Failed to create debate. Try again.')
    } finally {
      setCreating(false)
    }
  }

  const filtered = query
    ? topics.filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
    : topics

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>New Debate</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>What do you want to debate?</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search topics..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.topicRow, selectedTopic?.id === item.id && styles.topicRowSelected]}
              onPress={() => setSelectedTopic(item)}
            >
              <View style={styles.topicInfo}>
                <Text style={styles.topicTitle}>{item.title}</Text>
                <Text style={styles.topicMeta}>{item.category} · {item.debate_count} debates</Text>
              </View>
              {selectedTopic?.id === item.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No topics found.</Text>
          }
        />
      </View>

      {selectedTopic && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedLabel}>Selected: {selectedTopic.title}</Text>
          <TouchableOpacity
            style={[styles.startButton, creating && styles.startButtonDisabled]}
            onPress={handleCreate}
            disabled={creating}
          >
            <Text style={styles.startButtonText}>{creating ? 'Creating...' : 'Start Debate'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bgElevated, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, height: 56 },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  backArrow: { fontSize: 24, color: COLORS.textPrimary },
  content: { flex: 1, padding: 16 },
  heading: { fontFamily: 'serif', fontSize: 22, color: COLORS.textPrimary, marginBottom: 16 },
  searchInput: { backgroundColor: COLORS.bgSurface, color: COLORS.textPrimary, padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  topicRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginBottom: 8 },
  topicRowSelected: { borderWidth: 2, borderColor: COLORS.accentAmber },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  topicMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  checkmark: { color: COLORS.accentAmber, fontSize: 20, fontWeight: '700' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 32 },
  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle },
  selectedLabel: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 12 },
  startButton: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, alignItems: 'center', height: 48, justifyContent: 'center' },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
})
