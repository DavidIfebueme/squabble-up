import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { COLORS } from '../lib/design'

type Props = {
  message?: string
  action?: { label: string; onPress: () => void }
}

export default function EmptyState({ message = 'Nothing here yet.', action }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>~</Text>
      <Text style={styles.message}>{message}</Text>
      {action && (
        <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.bgPrimary },
  icon: { fontSize: 48, color: COLORS.textMuted, marginBottom: 16 },
  message: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  actionButton: { backgroundColor: COLORS.accentAmber, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  actionText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 14 },
})
