import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native'
import { createTopic } from '../lib/topics'
import type { ScreenProps } from '../lib/types'
import { COLORS } from '../lib/design'

const CATEGORIES = [
  'Politics',
  'Tech',
  'Sports',
  'Philosophy',
  'Pop Culture',
  'Science',
  'Ethics',
  'Food',
  'Music',
  'Gaming',
]

export default function TopicSuggestionScreen({ route, navigation }: ScreenProps<'TopicSuggestion'>) {
  const { query } = (route.params ?? {}) as { query?: string }
  const [title, setTitle] = useState(query ?? '')
  const [category, setCategory] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const titleValid = title.trim().length >= 10 && title.trim().length <= 120
  const descriptionValid =
    description.trim().length === 0 ||
    (description.trim().length >= 10 && description.trim().length <= 2000)
  const canSubmit = titleValid && category !== null && descriptionValid && !submitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !category) return

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    if (trimmedTitle.length < 10 || trimmedTitle.length > 120) {
      Alert.alert('Invalid title', 'Title must be between 10 and 120 characters.')
      return
    }

    if (trimmedDescription.length > 0 && (trimmedDescription.length < 10 || trimmedDescription.length > 2000)) {
      Alert.alert('Invalid description', 'Description must be between 10 and 2000 characters when provided.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createTopic({
        title: trimmedTitle,
        description: trimmedDescription,
        category,
      })

      if (result.success) {
        Alert.alert('Thanks! Your topic is under review.')
        setTimeout(() => {
          navigation.navigate('Home')
        }, 1500)
      } else {
        Alert.alert('Error', 'Could not submit your topic. Please try again.')
        setSubmitting(false)
      }
    } catch {
      Alert.alert('Error', 'Could not submit your topic. Please try again.')
      setSubmitting(false)
    }
  }, [canSubmit, category, description, title, navigation])

  const renderCategoryChip = useCallback(
    ({ item }: { item: string }) => {
      const isSelected = item === category
      return (
        <TouchableOpacity
          style={[styles.chip, isSelected && styles.chipSelected]}
          onPress={() => setCategory(item)}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{item}</Text>
        </TouchableOpacity>
      )
    },
    [category]
  )

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Suggest Topic</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>What should we debate?</Text>

        <Text style={styles.label}>Topic title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Should social media be regulated?"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          autoFocus={query === undefined}
        />
        <Text style={styles.hint}>10–120 characters</Text>

        <Text style={styles.label}>Category *</Text>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={renderCategoryChip}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add context or framing for the debate (optional)..."
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          maxLength={2000}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>10–2000 characters (optional)</Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    height: 56,
  },
  backArrow: { fontSize: 24, color: COLORS.textPrimary },
  topBarTitle: { flex: 1, fontFamily: 'DM Serif Display', fontSize: 20, color: COLORS.textPrimary, textAlign: 'center' },
  spacer: { width: 24 },
  content: { flex: 1, padding: 16 },
  heading: { fontFamily: 'DM Serif Display', fontSize: 22, color: COLORS.textPrimary, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 6,
  },
  textArea: { minHeight: 120, paddingTop: 16 },
  hint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 20 },
  chipList: { paddingVertical: 4, gap: 8, marginBottom: 20 },
  chip: {
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: { borderColor: COLORS.accentAmber, backgroundColor: COLORS.bgElevated },
  chipText: { color: COLORS.textPrimary, fontSize: 14 },
  chipTextSelected: { color: COLORS.accentAmber, fontWeight: '700' },
  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle },
  submitButton: {
    backgroundColor: COLORS.accentAmber,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
})
