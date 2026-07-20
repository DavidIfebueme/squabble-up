import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { COLORS } from '../lib/design'

type Props = {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Something went wrong.', onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>!</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.bgPrimary },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.recordRed, textAlign: 'center', lineHeight: 48, fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16, overflow: 'hidden' },
  message: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: COLORS.accentAmber, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 14 },
})
