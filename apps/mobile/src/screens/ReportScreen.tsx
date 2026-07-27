import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
import type { ScreenProps } from '../lib/types'
import { COLORS } from '../lib/design'

const REASONS = ['Hate speech', 'Harassment', 'Spam', 'Misinformation', 'Other']

export default function ReportScreen({ navigation }: ScreenProps<'Report'>) {
  const [reason, setReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(() => {
    if (!reason) {
      Alert.alert('Select a reason', 'Please choose a reason for reporting.')
      return
    }

    setSubmitting(true)

    // Backend integration will later use route params, reason, and details.
    Alert.alert('Thanks. Our moderation team will review this.', undefined, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }, [reason, details, navigation])

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CaretLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Report</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Why are you reporting this?</Text>

        {REASONS.map(item => {
          const isSelected = item === reason
          return (
            <TouchableOpacity
              key={item}
              style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
              onPress={() => setReason(item)}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>{item}</Text>
            </TouchableOpacity>
          )
        })}

        <Text style={styles.label}>Details (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add more context..."
          placeholderTextColor={COLORS.textMuted}
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, (!reason || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!reason || submitting}
        >
          <Text style={styles.submitButtonText}>Submit Report</Text>
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
  topBarTitle: { flex: 1, fontFamily: 'DM Serif Display', fontSize: 20, color: COLORS.textPrimary, textAlign: 'center' },
  spacer: { width: 24 },
  content: { flex: 1, padding: 16 },
  heading: { fontFamily: 'DM Serif Display', fontSize: 22, color: COLORS.textPrimary, marginBottom: 24 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonRowSelected: { borderColor: COLORS.accentAmber, backgroundColor: COLORS.bgElevated },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.accentAmber },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accentAmber },
  reasonText: { fontSize: 16, color: COLORS.textPrimary, fontFamily: 'Public Sans' },
  reasonTextSelected: { fontWeight: '700', color: COLORS.textPrimary },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginTop: 16, marginBottom: 8, fontFamily: 'Public Sans' },
  input: {
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Public Sans',
    minHeight: 120,
  },
  textArea: { paddingTop: 16 },
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
  submitButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16, fontFamily: 'Public Sans' },
})
