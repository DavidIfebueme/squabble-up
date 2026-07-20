import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { Debate } from '@squabble-up/shared'
import { getDebate } from '../lib/debates'

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

export default function DebateLobbyScreen({ route, navigation }: any) {
  const { debateId } = route.params
  const [debate, setDebate] = useState<Debate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDebate(debateId).then(result => {
      if (result.success) setDebate(result.data)
    }).finally(() => setLoading(false))
  }, [debateId])

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Joining debate...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Waiting for opponent...</Text>
      {debate && (
        <View style={styles.info}>
          <Text style={styles.label}>Debate ID</Text>
          <Text style={styles.value}>{debate.id.slice(0, 8)}</Text>
        </View>
      )}
      <View style={styles.slots}>
        <View style={styles.slot}>
          <View style={[styles.avatar, styles.avatarFilled]} />
          <Text style={styles.slotLabel}>You</Text>
        </View>
        <View style={styles.slot}>
          <View style={[styles.avatar, styles.avatarEmpty]} />
          <Text style={styles.slotLabel}>Waiting...</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: COLORS.textSecondary, fontSize: 16 },
  heading: { fontFamily: 'serif', fontSize: 22, color: COLORS.textPrimary, marginBottom: 32 },
  info: { alignItems: 'center', marginBottom: 48 },
  label: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
  value: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  slots: { flexDirection: 'row', gap: 48, marginBottom: 48 },
  slot: { alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8 },
  avatarFilled: { backgroundColor: COLORS.accentAmber },
  avatarEmpty: { backgroundColor: COLORS.borderSubtle, borderWidth: 2, borderColor: COLORS.accentAmber, borderStyle: 'dashed' },
  slotLabel: { color: COLORS.textSecondary, fontSize: 14 },
  cancelButton: { padding: 16 },
  cancelText: { color: COLORS.textSecondary, fontSize: 16 },
})
