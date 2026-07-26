import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
import * as SecureStore from 'expo-secure-store'
import type { ScreenProps } from '../lib/types'

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

const ACCESS_TOKEN_KEY = 'access_token'

type Props = ScreenProps<'Settings'>

interface SettingsRow {
  label: string
  value?: string
  danger?: boolean
  onPress: () => void
}

interface SettingsSection {
  title: string
  rows: SettingsRow[]
}

export default function SettingsScreen({ navigation, route }: Props) {
  const email = route.params?.email

  const showToast = (message: string) => {
    Alert.alert(message)
  }

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
      navigation.navigate('Auth')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log out.'
      Alert.alert('Error', message)
    }
  }

  const sections: SettingsSection[] = [
    {
      title: 'Account',
      rows: [
        {
          label: 'Email',
          value: email,
          onPress: () => showToast(email ? `Email: ${email}` : 'No email provided.'),
        },
        {
          label: 'Change Password',
          onPress: () => showToast('Change password flow coming soon.'),
        },
        {
          label: 'Delete Account',
          danger: true,
          onPress: () =>
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => showToast('Delete account request submitted.') },
              ]
            ),
        },
      ],
    },
    {
      title: 'About',
      rows: [
        {
          label: 'App Version',
          value: '0.1.0',
          onPress: () => showToast('App version 0.1.0'),
        },
        {
          label: 'Community Guidelines',
          onPress: () => navigation.navigate('CommunityGuidelines'),
        },
        {
          label: 'Privacy Policy',
          onPress: () => showToast('Privacy policy coming soon.'),
        },
        {
          label: 'Terms of Service',
          onPress: () => showToast('Terms of service coming soon.'),
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          label: 'Report a Problem',
          onPress: () => navigation.navigate('Report', { type: 'problem' }),
        },
        {
          label: 'Send Feedback',
          onPress: () => showToast('Feedback form coming soon.'),
        },
      ],
    },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarSide} onPress={() => navigation.goBack()}>
          <CaretLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Settings</Text>
        <View style={styles.topBarSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.rows.map((row, index) => (
                <TouchableOpacity
                  key={row.label}
                  style={[
                    styles.row,
                    index !== section.rows.length - 1 && styles.rowBorder,
                  ]}
                  onPress={row.onPress}
                >
                  <Text style={[styles.rowLabel, row.danger && styles.dangerText]}>
                    {row.label}
                  </Text>
                  {row.value ? (
                    <Text style={styles.rowValue}>{row.value}</Text>
                  ) : (
                    <CaretLeft color={row.danger ? COLORS.recordRed : COLORS.textMuted} size={20} style={styles.chevron} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 12,
  },
  topBarSide: { width: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: {
    flex: 1,
    fontFamily: 'DM Serif Display',
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  content: { padding: 16, paddingBottom: 48 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  rowLabel: { fontSize: 16, color: COLORS.textPrimary },
  rowValue: { fontSize: 14, color: COLORS.textMuted },
  dangerText: { color: COLORS.recordRed },
  chevron: { transform: [{ rotate: '180deg' }] },
  logoutButton: {
    borderWidth: 1,
    borderColor: COLORS.accentAmber,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.accentAmber },
})
