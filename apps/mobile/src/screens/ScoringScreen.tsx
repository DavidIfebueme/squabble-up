import { View, Text, StyleSheet } from 'react-native'

export default function ScoringScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scoring Results</Text>
      <View style={styles.card}>
        <Text style={styles.winnerLabel}>Winner</Text>
        <Text style={styles.winnerName}>Creator</Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>7.5</Text>
            <Text style={styles.scoreLabel}>Logic</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>8.0</Text>
            <Text style={styles.scoreLabel}>Evidence</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>7.2</Text>
            <Text style={styles.scoreLabel}>Delivery</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16, justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: '#1E293B', padding: 24, borderRadius: 16, alignItems: 'center' },
  winnerLabel: { fontSize: 14, color: '#64748B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  winnerName: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 24 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  scoreItem: { alignItems: 'center' },
  scoreValue: { fontSize: 28, fontWeight: '800', color: '#F1F5F9' },
  scoreLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
})
