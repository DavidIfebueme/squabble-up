import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native'
import Voice from '@react-native-voice/voice'

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  accentAmber: '#D4953A',
  recordRed: '#E53935',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  successGreen: '#66BB6A',
}

type Props = {
  duration: number
  onComplete: (result: { transcription: string; duration: number }) => void
  disabled?: boolean
}

type RecordingState = 'idle' | 'recording' | 'submitted'

export default function VoiceRecorder({ duration, onComplete, disabled }: Props) {
  const [state, setState] = useState<RecordingState>('idle')
  const [remaining, setRemaining] = useState(duration)
  const [error, setError] = useState<string | null>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const onAirOpacity = useRef(new Animated.Value(0.7)).current
  const accumulatedRef = useRef('')

  useEffect(() => {
    Voice.onSpeechStart = () => {}
    Voice.onSpeechEnd = () => {}
    Voice.onSpeechResults = (e) => {
      if (e.value) accumulatedRef.current = e.value[0] || accumulatedRef.current
    }
    Voice.onSpeechPartialResults = (e) => {
      if (e.value) accumulatedRef.current = e.value[0] || accumulatedRef.current
    }
    Voice.onSpeechError = () => {
      setError('Recording stopped. Check your microphone.')
      handleStopCleanup()
    }
    return () => { Voice.destroy().then(() => Voice.removeAllListeners()) }
  }, [])

  useEffect(() => {
    if (state !== 'recording') return
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [state, pulseAnim])

  useEffect(() => {
    if (state !== 'idle') return
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    )
    breath.start()
    return () => breath.stop()
  }, [state, pulseAnim])

  useEffect(() => {
    if (state !== 'recording') { onAirOpacity.setValue(0.7); return }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(onAirOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(onAirOpacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [state, onAirOpacity])

  useEffect(() => {
    if (state !== 'recording') return
    if (remaining <= 0) { handleStop(); return }
    const timer = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining, state])

  const handleStopCleanup = async () => {
    try {
      await Voice.stop()
    } catch { /* already stopped */ }
  }

  const handleStart = async () => {
    setError(null)
    try {
      const available = await Voice.isAvailable()
      if (!available) {
        setError('Speech recognition not available on this device.')
        return
      }
      accumulatedRef.current = ''
      await Voice.start(Platform.OS === 'android' ? 'en-US' : 'en-US')
      setState('recording')
    } catch (e: any) {
      setError(e?.message || 'Could not start recording. Check microphone permissions.')
    }
  }

  const handleStop = async () => {
    try {
      await Voice.stop()
      const text = accumulatedRef.current
      setState('submitted')
      onComplete({ transcription: text, duration: duration - remaining })
    } catch { /* silent on intentional stop */ }
  }

  const handleRetry = () => {
    setError(null)
    setState('idle')
    setRemaining(duration)
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timerColor = remaining <= 10 ? COLORS.recordRed
    : state === 'recording' ? COLORS.recordRed
    : COLORS.textPrimary

  const icon = state === 'recording' ? '⏹' : state === 'submitted' ? '✓' : '🎙'
  const iconStyle = state === 'submitted' ? styles.iconSubmitted : styles.iconDefault

  return (
    <View style={styles.container}>
      {state === 'recording' && (
        <Animated.View style={[styles.onAirBadge, { opacity: onAirOpacity }]}>
          <View style={styles.onAirDot} />
          <Text style={styles.onAirText}>ON AIR</Text>
        </Animated.View>
      )}

      <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }, state === 'recording' && styles.outerRingRecording, state === 'submitted' && styles.outerRingSubmitted]}>
        <View style={[styles.recordButton, state === 'recording' && styles.recordingButton]}>
          <TouchableOpacity
            onPress={state === 'recording' ? handleStop : handleStart}
            disabled={state === 'submitted' || disabled}
            style={styles.buttonTouch}
          >
            <Text style={[iconStyle, { fontSize: 36 }]}>{icon}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === 'idle' && !error && <Text style={styles.hint}>Tap to record</Text>}
      {state === 'submitted' && <Text style={styles.submittedText}>Recorded</Text>}

      <Text style={[styles.timer, { color: timerColor }]}>
        {mins}:{secs.toString().padStart(2, '0')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  onAirBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(229,57,53,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 6 },
  onAirDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.recordRed },
  onAirText: { fontSize: 12, fontWeight: '700', color: COLORS.recordRed, letterSpacing: 1 },
  outerRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: COLORS.accentAmber, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  outerRingRecording: { borderColor: COLORS.recordRed },
  outerRingSubmitted: { borderColor: COLORS.successGreen },
  recordButton: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.accentAmber, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center' },
  recordingButton: { backgroundColor: COLORS.recordRed, borderWidth: 0 },
  buttonTouch: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  iconDefault: { color: COLORS.textPrimary },
  iconSubmitted: { color: COLORS.successGreen },
  errorContainer: { alignItems: 'center', gap: 8 },
  errorText: { fontSize: 14, color: COLORS.recordRed, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '700', color: COLORS.accentAmber },
  hint: { fontSize: 14, color: COLORS.textSecondary },
  submittedText: { fontSize: 14, color: COLORS.successGreen },
  timer: { fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
})
