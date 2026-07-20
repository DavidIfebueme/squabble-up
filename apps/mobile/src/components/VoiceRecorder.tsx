import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { ExpoSpeechRecognitionModule, addSpeechRecognitionListener } from 'expo-speech-recognition'

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
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const remainingRef = useRef(remaining)
  remainingRef.current = remaining
  const durationRef = useRef(duration)
  durationRef.current = duration

  useEffect(() => {
    const sub1 = addSpeechRecognitionListener('result', (e) => {
      const transcript = e.results?.[0]?.transcript
      if (transcript) {
        if (e.isFinal) {
          accumulatedRef.current = transcript
        } else {
          accumulatedRef.current = transcript || accumulatedRef.current
        }
      }
    })
    const sub2 = addSpeechRecognitionListener('error', () => {
      setError('Recording stopped. Check your microphone.')
      setState('idle')
    })

    return () => {
      ExpoSpeechRecognitionModule.abort()
      sub1.remove()
      sub2.remove()
    }
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

  const handleStop = () => {
    try {
      ExpoSpeechRecognitionModule.stop()
    } catch {
      // Already stopped
    }
    const text = accumulatedRef.current
    setState('submitted')
    onCompleteRef.current({ transcription: text, duration: durationRef.current - remainingRef.current })
  }

  const handleStart = () => {
    setError(null)
    try {
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable()
      if (!available) {
        setError('Speech recognition not available on this device.')
        return
      }
      accumulatedRef.current = ''
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        requiresOnDeviceRecognition: Platform.OS === 'android',
      })
      setState('recording')
    } catch (e: any) {
      setError(e?.message || 'Could not start recording. Check microphone permissions.')
    }
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

  const iconName = state === 'recording' ? 'stop' : state === 'submitted' ? 'check' : 'mic'
  const iconColor = state === 'submitted' ? COLORS.successGreen : COLORS.textPrimary

  return (
    <View style={styles.container}>
      {state === 'recording' && (
        <Animated.View style={[styles.onAirBadge, { opacity: onAirOpacity }]}>
          <View style={styles.onAirDot} />
          <Text style={styles.onAirText}>ON AIR</Text>
        </Animated.View>
      )}

      <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={
            state === 'recording'
              ? ['rgba(229,57,53,0.3)', 'rgba(229,57,53,0.05)']
              : state === 'submitted'
                ? ['rgba(102,187,106,0.3)', 'rgba(102,187,106,0.05)']
                : ['rgba(212,149,58,0.35)', 'rgba(212,149,58,0.05)']
          }
          style={[
            styles.outerRing,
            state === 'recording' && styles.outerRingRecording,
            state === 'submitted' && styles.outerRingSubmitted,
          ]}
        >
          <View style={[styles.recordButton, state === 'recording' && styles.recordingButton]}>
            <TouchableOpacity
              onPress={state === 'recording' ? handleStop : handleStart}
              disabled={state === 'submitted' || disabled}
              style={styles.buttonTouch}
            >
              <MaterialIcons name={iconName} size={36} color={iconColor} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
  outerRing: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.accentAmber },
  outerRingRecording: { borderColor: COLORS.recordRed },
  outerRingSubmitted: { borderColor: COLORS.successGreen },
  recordButton: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.accentAmber, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center' },
  recordingButton: { backgroundColor: COLORS.recordRed, borderWidth: 0 },
  buttonTouch: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  errorContainer: { alignItems: 'center', gap: 8 },
  errorText: { fontSize: 14, color: COLORS.recordRed, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '700', color: COLORS.accentAmber },
  hint: { fontSize: 14, color: COLORS.textSecondary },
  submittedText: { fontSize: 14, color: COLORS.successGreen },
  timer: { fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
})
