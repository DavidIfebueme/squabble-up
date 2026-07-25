import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { COLORS } from '../lib/design'

type Props = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

export default function Button({ title, onPress, variant = 'primary' }: Props) {
  return (
    <TouchableOpacity
      style={[styles.base, variant === 'primary' ? styles.primary : styles.secondary]}
      onPress={onPress}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: { padding: 16, borderRadius: 12, alignItems: 'center' },
  primary: { backgroundColor: COLORS.accentAmber },
  secondary: { borderWidth: 1, borderColor: COLORS.borderSubtle, backgroundColor: 'transparent' },
  text: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 16 },
  secondaryText: { color: COLORS.textSecondary },
})
