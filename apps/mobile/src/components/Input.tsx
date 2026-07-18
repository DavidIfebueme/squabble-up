import { TextInput, StyleSheet } from 'react-native'

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
      placeholderTextColor="#64748B"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
    />
  )
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#1E293B', color: '#F1F5F9', padding: 16, borderRadius: 12, fontSize: 16 },
})
