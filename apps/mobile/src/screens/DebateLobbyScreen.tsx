import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated, Share, Alert } from 'react-native'
import type { Debate } from '@squabble-up/shared'
import { getDebate, joinDebate } from '../lib/debates'
import { getTopicByIdentifier } from '../lib/topics'
import { DEBATE_ROUNDS, ROUND_DURATIONS, ROUND_NUMBER_TO_TYPE } from '@squabble-up/shared'

const COLORS = {
  bgPrimary: '#1E1E1E',
  bgSurface: '#2A2A2A',
  bgElevated: '#333333',
  accentAmber: '#D4953A',
  textPrimary: '#F5F0E8',
  textSecondary: '#A0998F',
  textMuted: '#6B6560',
  borderSubtle: '#3A3A3A',
}

const TIMEOUT_MS = 5 * 60 * 1000
const COUNTDOWN_SECONDS = 3
const POLL_INTERVAL_MS = 3000

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from './DebateRoundScreen'

type Props = NativeStackScreenProps<RootStackParamList, 'DebateLobby'>

export default function DebateLobbyScreen({ route, navigation }: Props) {
  const { debateId, side: initialSide } = route.params
  const [debate, setDebate] = useState<Debate | null>(null)
  const [topicTitle, setTopicTitle] = useState<string | null>(null)
  const [side, setSide] = useState<'creator' | 'opponent'>((initialSide as 'creator' | 'opponent') ?? 'creator')
  const [joined, setJoined] = useState(!!initialSide)
  const [opponentJoined, setOpponentJoined] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [timedOut, setTimedOut] = useState(false)
  const [joining, setJoining] = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDebate = useCallback(async () => {
    try {
      const result = await getDebate(debateId)
      if (result.success) {
        setDebate(result.data)
        if (result.data.opponent_id) setOpponentJoined(true)
      }
    } catch { /* silent */ }
  }, [debateId])

  useEffect(() => {
    fetchDebate()
  }, [fetchDebate])

  useEffect(() => {
    if (!debate) return
    getTopicByIdentifier(debate.topic_id).then(result => {
      if (result.success) setTopicTitle(result.data.title)
    })
  }, [debate?.topic_id])

  useEffect(() => {
    if (joined || joining) return
    setJoining(true)
    joinDebate(debateId).then(result => {
      if (result.success) {
        setJoined(true)
        setSide('opponent')
        setDebate(result.data.debate)
      } else {
        Alert.alert('Error', 'Could not join debate.')
        navigation.goBack()
      }
    }).catch(() => {
      Alert.alert('Error', 'Could not join debate.')
      navigation.goBack()
    })
  }, [debateId, joined, joining, navigation])

  useEffect(() => {
    if (!joined) return
    pollRef.current = setInterval(fetchDebate, POLL_INTERVAL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [joined, fetchDebate])

  useEffect(() => {
    if (!opponentJoined || timedOut) return
    if (pollRef.current) clearInterval(pollRef.current)
    if (countdown <= 0) {
      navigation.replace('DebateRound', { debateId, roundNumber: 1, side })
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, opponentJoined, timedOut, navigation, debateId, side])

  useEffect(() => {
    if (timedOut || opponentJoined) return
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [timedOut, opponentJoined])

  useEffect(() => {
    if (opponentJoined) return
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opponentJoined, pulseAnim])

  const handleInvite = async () => {
    try {
      await Share.share({ message: `Debate me on Squabble Up: squabbleup://debate/${debateId}` })
    } catch { /* share cancelled */ }
  }

  const handleLeave = () => navigation.goBack()

  const sideLabel = side === 'creator' ? 'FOR' : 'AGAINST'
  const rules = useMemo(() => Array.from({ length: DEBATE_ROUNDS }, (_, i) => {
    const num = i + 1
    const type = ROUND_NUMBER_TO_TYPE[num as keyof typeof ROUND_NUMBER_TO_TYPE]
    const dur = type ? ROUND_DURATIONS[type] : 90
    return { round: num, name: type ? type.charAt(0).toUpperCase() + type.slice(1) : '', duration: dur }
  }), [])

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {opponentJoined
          ? countdown > 0 ? `${countdown}` : 'Starting...'
          : timedOut
            ? 'No one joined.'
            : joining ? 'Joining debate...' : 'Waiting for opponent...'}
      </Text>

      {topicTitle && (
        <Text style={styles.topicTitle}>{topicTitle}</Text>
      )}

      <Text style={styles.sideBadge}>You: {sideLabel}</Text>

      {!opponentJoined && !timedOut && (
        <View style={styles.rulesContainer}>
          {rules.map(r => (
            <Text key={r.round} style={styles.ruleText}>
              Round {r.round}: {r.name} — {r.duration}s
            </Text>
          ))}
          <Text style={styles.ruleTagline}>Be sharp, be fair, be heard.</Text>
        </View>
      )}

      <View style={styles.slots}>
        <View style={styles.slot}>
          <Animated.View style={[styles.avatar, styles.avatarFilled, { borderColor: COLORS.accentAmber }]}>
            <Text style={styles.avatarText}>You</Text>
          </Animated.View>
          <Text style={styles.slotLabel}>You</Text>
        </View>

        <View style={styles.slot}>
          {opponentJoined ? (
            <View style={[styles.avatar, styles.avatarFilled]}>
              <Text style={styles.avatarText}>Opp</Text>
            </View>
          ) : (
            <Animated.View style={[styles.avatar, styles.avatarEmpty, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.avatarText}>?</Text>
            </Animated.View>
          )}
          <Text style={styles.slotLabel}>{opponentJoined ? 'Opponent' : 'Waiting...'}</Text>
        </View>
      </View>

      {timedOut && !opponentJoined && (
        <Text style={styles.timeoutText}>Try again or invite a friend.</Text>
      )}

      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={handleLeave}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        {(timedOut || debate?.status === 'pending') && (
          <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
            <Text style={styles.inviteButtonText}>Invite Friend</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heading: { fontFamily: 'serif', fontSize: 22, color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  topicTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  sideBadge: { backgroundColor: COLORS.accentAmber, color: COLORS.bgPrimary, fontSize: 14, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 24 },
  rulesContainer: { backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginBottom: 24, width: '100%' },
  ruleText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  ruleTagline: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 8 },
  slots: { flexDirection: 'row', gap: 48, marginBottom: 48 },
  slot: { alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  avatarFilled: { backgroundColor: COLORS.accentAmber },
  avatarEmpty: { backgroundColor: COLORS.borderSubtle, borderWidth: 3, borderColor: COLORS.accentAmber, borderStyle: 'dashed' },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.bgPrimary },
  slotLabel: { color: COLORS.textSecondary, fontSize: 14 },
  timeoutText: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 24, textAlign: 'center' },
  bottomActions: { flexDirection: 'row', gap: 24, alignItems: 'center' },
  cancelText: { color: COLORS.textSecondary, fontSize: 16 },
  inviteButton: { backgroundColor: COLORS.accentAmber, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  inviteButtonText: { color: COLORS.bgPrimary, fontWeight: '700', fontSize: 14 },
})
