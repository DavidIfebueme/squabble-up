import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../lib/design'

type Props = {
  label: string
  score: number
  maxScore?: number
}

export default function ScoreBar({ label, score, maxScore = 10 }: Props) {
  const pct = (score / maxScore) * 100

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score.toFixed(1)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 14, color: COLORS.textSecondary },
  score: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  track: { height: 8, backgroundColor: COLORS.borderSubtle, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: COLORS.accentAmber, borderRadius: 4 },
})
