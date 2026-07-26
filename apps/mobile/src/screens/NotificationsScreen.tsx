import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { Bell, ChartBar, ChatTeardropText } from 'phosphor-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/types'

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

type LocalStackParamList = RootStackParamList & {
  Notifications: undefined
}

type Props = NativeStackScreenProps<LocalStackParamList, 'Notifications'>

type NotificationIcon = 'bell' | 'chart' | 'chat'

interface Notification {
  id: string
  icon: NotificationIcon
  title: string
  body: string
  timestamp: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: 'chart',
    title: 'Your debate results are ready',
    body: 'The audience has spoken. See how your argument scored across logic, evidence, and delivery.',
    timestamp: '2 min ago',
  },
  {
    id: '2',
    icon: 'bell',
    title: 'Someone voted on your debate',
    body: 'A new vote was cast on "Remote work is the future of tech."',
    timestamp: '1 hour ago',
  },
  {
    id: '3',
    icon: 'chat',
    title: 'New comment on your debate',
    body: 'A viewer left feedback on your closing argument.',
    timestamp: 'Yesterday',
  },
]

function NotificationIcon({ name, size }: { name: NotificationIcon; size: number }) {
  const color = COLORS.accentAmber
  if (name === 'chart') return <ChartBar color={color} size={size} weight="bold" />
  if (name === 'chat') return <ChatTeardropText color={color} size={size} weight="bold" />
  return <Bell color={color} size={size} weight="bold" />
}

export default function NotificationsScreen({ navigation }: Props) {
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.goBack()}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <NotificationIcon name={item.icon} size={24} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Notifications</Text>
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: {
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    alignItems: 'center',
  },
  topBarTitle: {
    fontFamily: 'DM Serif Display',
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  timestamp: { fontSize: 12, color: COLORS.textMuted },
  body: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  emptyState: { alignItems: 'center', marginTop: 64, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
})
