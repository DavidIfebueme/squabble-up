import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated, Share, Alert } from 'react-native'
import type { Debate } from '@squabble-up/shared'
import { getDebate, joinDebate } from '../lib/debates'

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

export default function DebateLobbyScreen({ route, navigation }: any) {
  const { debateId, side: initialSide } = route.params
  const [debate, setDebate] = useState<Debate | null>(null)
  const [side, setSide] = useState<'creator' | 'opponent'>(initialSide ?? 'creator')
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
    if (joined || joining) return
    setJoining(true)
    joinDebate(debateId).then(result => {
      if (result.success) {
        setJoined(true)
        setSide(result.data.debate.creator_id ? 'creator' : 'opponent')
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
      Alert.alert('Debate Ready', 'Both participants are here. The debate will begin soon.')
      navigation.navigate('Main')
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, opponentJoined, timedOut, navigation])

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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {opponentJoined
          ? countdown > 0 ? `${countdown}` : 'Starting...'
          : timedOut
            ? 'No one joined.'
            : joining ? 'Joining debate...' : 'Waiting for opponent...'}
      </Text>

      {debate && (
        <Text style={styles.debateId}>Debate #{debate.id.slice(0, 8)}</Text>
      )}

      <Text style={styles.sideBadge}>You: {sideLabel}</Text>

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
  debateId: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  sideBadge: { backgroundColor: COLORS.accentAmber, color: COLORS.bgPrimary, fontSize: 14, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 48 },
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
