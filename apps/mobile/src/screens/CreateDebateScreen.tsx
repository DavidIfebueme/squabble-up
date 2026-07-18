import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'

export default function CreateDebateScreen({ navigation }: any) {
  const [topic, setTopic] = useState('')

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Debate</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter debate topic..."
        placeholderTextColor="#64748B"
        value={topic}
        onChangeText={setTopic}
      />
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Start Debate</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryButtonText}>Join Existing Debate</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginTop: 48, marginBottom: 24 },
  input: { backgroundColor: '#1E293B', color: '#F1F5F9', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  secondaryButton: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  secondaryButtonText: { color: '#94A3B8', fontWeight: '600', fontSize: 16 },
})
