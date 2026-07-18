import { View, Text, StyleSheet } from 'react-native'

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <View style={styles.card}>
        <View style={styles.avatar} />
        <Text style={styles.name}>Guest User</Text>
        <Text style={styles.elo}>ELO: --</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Debates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginTop: 48, marginBottom: 24 },
  card: { backgroundColor: '#1E293B', padding: 24, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#F1F5F9' },
  elo: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#3B82F6' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
})
