import { View, Text, StyleSheet } from 'react-native'

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
  label: { fontSize: 14, color: '#94A3B8' },
  score: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  track: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
})
