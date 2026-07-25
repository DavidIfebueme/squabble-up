import { TextInput, StyleSheet } from 'react-native'
import { COLORS } from '../lib/design'

type Props = {
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
}

export default function Input({ placeholder, value, onChangeText, secureTextEntry }: Props) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
    />
  )
}

const styles = StyleSheet.create({
  input: { backgroundColor: COLORS.bgSurface, color: COLORS.textPrimary, padding: 16, borderRadius: 12, fontSize: 16 },
})
