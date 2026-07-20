import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Switch } from 'react-native'
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

type Side = 'creator' | 'opponent'

const STEPS = ['Topic', 'Settings', 'Lobby'] as const

export default function CreateDebateScreen({ navigation }: any) {
  const [step, setStep] = useState(0)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [query, setQuery] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [side, setSide] = useState<Side | null>(null)
  const [communityVoting, setCommunityVoting] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getTopics({ limit: 20 }).then(result => {
      if (result.success && result.data) setTopics(result.data)
    })
  }, [])

  const filtered = query
    ? topics.filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
    : topics

  const handleCreate = async () => {
    if (!selectedTopic || creating) return
    setCreating(true)
    try {
      const result = await createDebate({
        topic_id: selectedTopic.id,
        participant_role: side ?? 'creator',
        community_voting: communityVoting,
      })
      if (result.success) {
        navigation.replace('DebateLobby', { debateId: result.data.debate.id, side: side ?? 'creator' })
      }
    } catch {
      Alert.alert('Error', 'Failed to create debate. Try again.')
    } finally {
      setCreating(false)
    }
  }

  const canAdvanceStep0 = selectedTopic !== null
  const canAdvanceStep1 = side !== null

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
            <Text style={[styles.stepNumber, i <= step && styles.stepNumberActive]}>{i + 1}</Text>
          </View>
          <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  )

  const renderStep0 = () => (
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
        ListEmptyComponent={<Text style={styles.emptyText}>No topics found.</Text>}
      />
    </View>
  )

  const renderStep1 = () => (
    <View style={styles.content}>
      <Text style={styles.heading}>Pick your side</Text>
      <View style={styles.sidePicker}>
        <TouchableOpacity
          style={[styles.sideCard, side === 'creator' && styles.sideCardSelected]}
          onPress={() => setSide('creator')}
        >
          <Text style={[styles.sideLabel, side === 'creator' && styles.sideLabelSelected]}>FOR</Text>
          <Text style={styles.sideDesc}>You argue in favor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sideCard, side === 'opponent' && styles.sideCardSelected]}
          onPress={() => setSide('opponent')}
        >
          <Text style={[styles.sideLabel, side === 'opponent' && styles.sideLabelSelected]}>AGAINST</Text>
          <Text style={styles.sideDesc}>You argue against</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.votingToggle}>
        <View style={styles.votingToggleRow}>
          <View style={styles.votingToggleInfo}>
            <Text style={styles.votingToggleLabel}>Let the community vote?</Text>
            <Text style={styles.votingToggleDesc}>Community votes add 30% weight to the final score.</Text>
          </View>
          <Switch
            value={communityVoting}
            onValueChange={setCommunityVoting}
            trackColor={{ false: COLORS.borderSubtle, true: COLORS.accentAmber }}
            thumbColor={communityVoting ? COLORS.bgPrimary : COLORS.textMuted}
          />
        </View>
      </View>

      <View style={styles.timerInfo}>
        <Text style={styles.timerLabel}>Round Timers</Text>
        <Text style={styles.timerValue}>90s opening · 90s rebuttal · 60s closing</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>New Debate</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}

      <View style={styles.bottomBar}>
        {step < 2 ? (
          <TouchableOpacity
            style={[styles.continueButton, ((step === 0 && !canAdvanceStep0) || (step === 1 && !canAdvanceStep1)) && styles.continueButtonDisabled]}
            onPress={() => setStep(step + 1)}
            disabled={(step === 0 && !canAdvanceStep0) || (step === 1 && !canAdvanceStep1)}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.startButton, creating && styles.startButtonDisabled]}
            onPress={handleCreate}
            disabled={creating}
          >
            <Text style={styles.startButtonText}>{creating ? 'Creating...' : 'Start Debate'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bgElevated, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, height: 56 },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  backArrow: { fontSize: 24, color: COLORS.textPrimary },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24, gap: 4 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: COLORS.accentAmber },
  stepNumber: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  stepNumberActive: { color: COLORS.bgPrimary },
  stepLabel: { fontSize: 12, color: COLORS.textMuted, marginLeft: 6 },
  stepLabelActive: { color: COLORS.accentAmber },
  stepLine: { width: 24, height: 2, backgroundColor: COLORS.borderSubtle, marginHorizontal: 8 },
  stepLineActive: { backgroundColor: COLORS.accentAmber },
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
  sidePicker: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  sideCard: { flex: 1, backgroundColor: COLORS.bgSurface, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  sideCardSelected: { borderColor: COLORS.accentAmber },
  sideLabel: { fontSize: 18, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 4 },
  sideLabelSelected: { color: COLORS.accentAmber },
  sideDesc: { fontSize: 12, color: COLORS.textMuted },
  timerInfo: { backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginTop: 12 },
  timerLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  timerValue: { fontSize: 14, color: COLORS.textMuted },
  votingToggle: { backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginBottom: 12 },
  votingToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  votingToggleInfo: { flex: 1, marginRight: 12 },
  votingToggleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  votingToggleDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle },
  continueButton: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, alignItems: 'center', height: 48, justifyContent: 'center' },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
  startButton: { backgroundColor: COLORS.accentAmber, padding: 16, borderRadius: 12, alignItems: 'center', height: 48, justifyContent: 'center' },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
})
