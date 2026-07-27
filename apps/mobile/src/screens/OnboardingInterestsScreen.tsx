import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native'
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

export default function OnboardingInterestsScreen({ navigation }: ScreenProps<'OnboardingInterests'>) {
  const [selected, setSelected] = useState<string[]>([])

  const toggleInterest = (category: string) => {
    setSelected((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    )
  }

  const canProceed = selected.length >= 3

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What do you care about?</Text>
      <Text style={styles.subtitle}>Pick at least 3. We'll find debates you'll love.</Text>

      <View style={styles.countPill}>
        <Text style={styles.countText}>{selected.length} selected</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        numColumns={2}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item)
          return (
            <TouchableOpacity
              style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
              onPress={() => toggleInterest(item)}
            >
              <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                {item}
              </Text>
            </TouchableOpacity>
          )
        }}
      />

      <TouchableOpacity
        style={[styles.button, !canProceed && styles.buttonDisabled]}
        onPress={() => navigation.navigate('OnboardingPersona', { interests: selected })}
        disabled={!canProceed}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    padding: 24,
  },
  heading: {
    fontFamily: 'DM Serif Display',
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  grid: {
    paddingBottom: 16,
  },
  chip: {
    flex: 1,
    margin: 6,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '42%',
  },
  chipSelected: {
    backgroundColor: COLORS.accentAmber,
  },
  chipUnselected: {
    backgroundColor: COLORS.bgSurface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: COLORS.bgPrimary,
  },
  chipTextUnselected: {
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.accentAmber,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
})
