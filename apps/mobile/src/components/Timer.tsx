import { useEffect, useState } from 'react'
import { Text, StyleSheet } from 'react-native'

type Props = {
  seconds: number
  onComplete?: () => void
  label?: string
}

export default function Timer({ seconds, onComplete, label }: Props) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.()
      return
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(id)
  }, [remaining, onComplete])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <Text style={styles.timer}>
      {label ? `${label} ` : ''}{mins}:{secs.toString().padStart(2, '0')}
    </Text>
  )
}

const styles = StyleSheet.create({
  timer: { fontSize: 24, fontWeight: '700', color: '#F8FAFC', textAlign: 'center', fontVariant: ['tabular-nums'] },
})
