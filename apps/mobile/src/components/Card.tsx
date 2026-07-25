import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../lib/design'

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
  card: { backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
})
