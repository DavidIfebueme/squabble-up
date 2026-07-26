import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { ScreenProps } from '../lib/types'

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

export default function BlockUserScreen({ navigation, route }: ScreenProps<'BlockUser'>) {
  const { username } = route.params as { username: string }

  const handleBlock = () => {
    // Backend integration will be wired later.
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Block User</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Block {username}?</Text>
        <Text style={styles.body}>
          They won&apos;t be able to debate you, vote on your debates, or comment on your activity.
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.blockButton} onPress={handleBlock}>
            <Text style={styles.blockButtonText}>Block</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heading: { fontFamily: 'DM Serif Display', fontSize: 28, color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
  body: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  buttonGroup: { width: '100%', gap: 12 },
  blockButton: {
    backgroundColor: COLORS.bgSurface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  blockButtonText: { color: COLORS.recordRed, fontWeight: '700', fontSize: 16 },
  cancelButton: {
    backgroundColor: COLORS.bgSurface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  cancelButtonText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
})
