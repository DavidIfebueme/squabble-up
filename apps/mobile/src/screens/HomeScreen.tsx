import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'

const MOCK_TOPICS = [
  { id: '1', title: 'Is AI art real art?', category: 'Technology', debate_count: 42 },
  { id: '2', title: 'Should voting be mandatory?', category: 'Politics', debate_count: 28 },
  { id: '3', title: 'Is remote work better?', category: 'Business', debate_count: 35 },
]

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Squabble Up</Text>
      <Text style={styles.subtitle}>Trending Topics</Text>
      <FlatList
        data={MOCK_TOPICS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('CreateDebate')}>
            <Text style={styles.topicTitle}>{item.title}</Text>
            <Text style={styles.topicMeta}>{item.category} - {item.debate_count} debates</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.guestButton} onPress={() => navigation.navigate('GuestDebate')}>
        <Text style={styles.guestButtonText}>Quick Debate (No Account)</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', marginTop: 48, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 24 },
  card: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 12 },
  topicTitle: { fontSize: 16, fontWeight: '600', color: '#F1F5F9' },
  topicMeta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  guestButton: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, marginTop: 16, alignItems: 'center' },
  guestButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
})
