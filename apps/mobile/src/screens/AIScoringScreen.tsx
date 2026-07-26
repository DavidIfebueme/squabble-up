import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { ScreenProps } from '../lib/types'
import { triggerScoring } from '../lib/debates'

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  bgElevated: '#333333',
  accentAmber: '#D4953A',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  borderSubtle: '#3A3A3A',
  successGreen: '#66BB6A',
  recordRed: '#E53935',
}

const STEPS = [
  { key: 'transcribing', label: 'Transcribing arguments...' },
  { key: 'analyzing', label: 'Analyzing logic & reasoning...' },
  { key: 'evaluating', label: 'Evaluating evidence & support...' },
  { key: 'scoring', label: 'Scoring rhetoric & delivery...' },
  { key: 'calculating', label: 'Calculating final score...' },
]

const STEP_DELAY = 1800

export default function AIScoringScreen({ navigation, route }: ScreenProps<'AIScoring'>) {
  const { debateId } = route.params
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<'retrying' | 'manual' | 'failed' | 'flagged' | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(30)
  const mountedRef = useRef(true)

  const startAnimation = () => {
    setError(null)
    setCompletedSteps(new Set())
    setCurrentStep(0)

    const animateSteps = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (!mountedRef.current) return
        await new Promise((r) => setTimeout(r, STEP_DELAY))
        if (!mountedRef.current) return
        setCompletedSteps((prev) => new Set(prev).add(STEPS[i].key))
        setCurrentStep(i + 1)
      }
    }

    animateSteps()
  }

  const callScoringApi = async () => {
    try {
      await triggerScoring(debateId)
      if (!mountedRef.current) return
      await new Promise((r) => setTimeout(r, 500))
      if (!mountedRef.current) return
      navigation.replace('Verdict', { debateId })
    } catch (err: unknown) {
      if (!mountedRef.current) return
      const message = err instanceof Error ? err.message : ''
      if (message.includes('flagged') || message.includes('policy')) {
        setError('flagged')
        return
      }
      if (retryCount === 0) {
        setError('retrying')
        setRetryCount(1)
        let count = 30
        const interval = setInterval(() => {
          count--
          setCountdown(count)
          if (count <= 0) {
            clearInterval(interval)
            callScoringApi()
          }
        }, 1000)
        return
      }
      if (retryCount === 1) {
        setError('manual')
        setRetryCount(2)
        return
      }
      setError('failed')
    }
  }

  useEffect(() => {
    startAnimation()
    const timer = setTimeout(() => callScoringApi(), STEPS.length * STEP_DELAY + 500)
    return () => {
      mountedRef.current = false
      clearTimeout(timer)
    }
  }, [])

  if (error === 'flagged') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.flaggedIcon}>!</Text>
          <Text style={styles.flaggedTitle}>Under Review</Text>
          <Text style={styles.flaggedDesc}>
            This debate is under review. Results will be available after moderation.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Main')}>
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        {error === 'failed' ? (
          <>
            <Text style={styles.errorTitle}>Scoring Unavailable</Text>
            <Text style={styles.errorDesc}>We'll notify you when scores are ready.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Main')}>
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.spinner}>
              <View style={styles.spinnerInner} />
            </View>
            <Text style={styles.statusText}>
              {error === 'retrying'
                ? `Hmm, the AI is taking longer than expected. Retrying in ${countdown}s...`
                : error === 'manual'
                  ? 'The AI couldn\'t score this debate right now.'
                  : 'The AI is reviewing your debate...'}
            </Text>
            <View style={styles.stepsContainer}>
              {STEPS.map((step, i) => {
                const done = completedSteps.has(step.key)
                const active = !done && currentStep === i
                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                      {done && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
                  </View>
                )
              })}
            </View>
            {error === 'manual' && (
              <TouchableOpacity style={styles.primaryButton} onPress={callScoringApi}>
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: COLORS.borderSubtle,
    borderTopColor: COLORS.accentAmber,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accentAmber },
  statusText: { fontSize: 16, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 32, fontFamily: 'Public Sans' },
  stepsContainer: { alignSelf: 'stretch', gap: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.textMuted, justifyContent: 'center', alignItems: 'center' },
  stepDotDone: { borderColor: COLORS.successGreen, backgroundColor: COLORS.successGreen },
  stepDotActive: { borderColor: COLORS.accentAmber },
  checkmark: { fontSize: 12, color: '#fff', fontWeight: '700' },
  stepLabel: { fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Public Sans' },
  stepLabelDone: { color: COLORS.textPrimary },
  errorTitle: { fontSize: 20, color: COLORS.recordRed, fontFamily: 'DM Serif Display', marginBottom: 8 },
  errorDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, fontFamily: 'Public Sans' },
  flaggedIcon: { fontSize: 48, color: COLORS.accentAmber, fontWeight: '700', marginBottom: 8 },
  flaggedTitle: { fontSize: 20, color: COLORS.accentAmber, fontFamily: 'DM Serif Display', marginBottom: 8 },
  flaggedDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, fontFamily: 'Public Sans' },
  primaryButton: { backgroundColor: COLORS.accentAmber, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.bgPrimary, fontFamily: 'Public Sans' },
})
