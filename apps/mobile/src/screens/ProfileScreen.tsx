import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { getMyProfile, getUserStats, getUserHistory } from '../lib/users'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<any, 'Profile'>

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

export default function ProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [profileRes, statsRes, historyRes] = await Promise.all([
          getMyProfile(),
          getUserStats((await getMyProfile()).id),
          getUserHistory((await getMyProfile()).id),
        ])
        if (!cancelled) {
          setProfile(profileRes)
          setStats(statsRes.data)
          setHistory(historyRes.data || [])
        }
      } catch {
        // Not authenticated or error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accentAmber} />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Profile</Text>
        <View style={styles.card}>
          <View style={styles.avatar} />
          <Text style={styles.name}>Guest User</Text>
          <Text style={styles.elo}>Sign in to see your profile</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile.display_name || 'Anonymous'}</Text>
        <Text style={styles.elo}>ELO: {stats?.elo_score ?? '--'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.total_debates ?? 0}</Text>
          <Text style={styles.statLabel}>Debates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.win_rate ?? 0}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.wins ?? 0}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Debates</Text>

      {history.length === 0 ? (
        <Text style={styles.emptyText}>No debates yet. Start your first debate!</Text>
      ) : (
        <FlatList
          data={history.slice(0, 10)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.historyCard}
              onPress={() => navigation.navigate('Scoring', { debateId: item.id })}
            >
              <View style={styles.historyInfo}>
                <Text style={styles.historyTopic}>Debate</Text>
                <Text style={styles.historyDate}>
                  {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ''}
                </Text>
              </View>
              <View style={[styles.resultBadge, item.result === 'won' && styles.resultWon, item.result === 'lost' && styles.resultLost]}>
                <Text style={[styles.resultText, item.result === 'won' && styles.resultTextWon, item.result === 'lost' && styles.resultTextLost]}>
                  {item.result.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginTop: 48, marginBottom: 24 },
  card: { backgroundColor: COLORS.bgSurface, padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accentAmber, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.bgPrimary },
  name: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  elo: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statNumber: { fontFamily: 'serif', fontSize: 22, fontWeight: '800', color: COLORS.accentAmber },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSurface, padding: 16, borderRadius: 12, marginBottom: 8 },
  historyInfo: { flex: 1 },
  historyTopic: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  historyDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  resultBadge: { backgroundColor: COLORS.bgElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resultWon: { backgroundColor: 'rgba(102,187,106,0.2)' },
  resultLost: { backgroundColor: 'rgba(229,57,53,0.2)' },
  resultText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  resultTextWon: { color: COLORS.successGreen },
  resultTextLost: { color: COLORS.recordRed },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 32 },
})
