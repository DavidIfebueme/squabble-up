import { View, Text, StyleSheet, FlatList } from 'react-native'

const MOCK_DEBATES = [
  { id: '1', topic: 'Is AI art real art?', status: 'active', participants: 2 },
  { id: '2', topic: 'Should voting be mandatory?', status: 'pending', participants: 1 },
  { id: '3', topic: 'Is remote work better?', status: 'completed', participants: 2 },
]

export default function DebateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Live Debates</Text>
      <FlatList
        data={MOCK_DEBATES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.topicTitle}>{item.topic}</Text>
            <View style={styles.row}>
              <Text style={styles.status}>{item.status.toUpperCase()}</Text>
              <Text style={styles.participants}>{item.participants}/2 participants</Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginTop: 48, marginBottom: 24 },
  card: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 12 },
  topicTitle: { fontSize: 16, fontWeight: '600', color: '#F1F5F9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  status: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
  participants: { fontSize: 12, color: '#64748B' },
})
