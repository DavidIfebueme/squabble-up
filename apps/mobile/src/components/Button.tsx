import { TouchableOpacity, Text, StyleSheet } from 'react-native'

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
  primary: { backgroundColor: '#3B82F6' },
  secondary: { borderWidth: 1, borderColor: '#334155', backgroundColor: 'transparent' },
  text: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  secondaryText: { color: '#94A3B8' },
})
