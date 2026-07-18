import { View, Text, StyleSheet } from 'react-native'

type Props = {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export default function Card({ title, subtitle, children }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#F1F5F9' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
})
