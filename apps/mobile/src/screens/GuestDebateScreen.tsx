import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

export default function GuestDebateScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quick Debate</Text>
      <Text style={styles.description}>
        Jump into a debate without creating an account. You will get scoring but your results will not be saved.
      </Text>
      <View style={styles.warning}>
        <Text style={styles.warningText}>Guest sessions expire after 24 hours</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Start Arguing</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16, justifyContent: 'center' },
  header: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 16, color: '#94A3B8', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  warning: { backgroundColor: '#422006', padding: 12, borderRadius: 8, marginBottom: 24 },
  warningText: { color: '#FBBF24', fontSize: 14, textAlign: 'center' },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
})
