import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
import { updateProfile } from '../lib/users'
import type { ScreenProps } from '../lib/types'
import { COLORS } from '../lib/design'

export default function EditProfileScreen({ navigation, route }: ScreenProps<'EditProfile'>) {
  const user = route.params?.user
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)

  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || '?'

  const handleSave = async () => {
    const trimmed = displayName.trim()
    if (!trimmed) {
      Alert.alert('Error', 'Display name is required.')
      return
    }
    if (trimmed.length > 50) {
      Alert.alert('Error', 'Display name must be 50 characters or less.')
      return
    }
    setLoading(true)
    try {
      await updateProfile({
        display_name: trimmed,
        avatar_url: user?.avatar_url ?? undefined,
      })
      navigation.goBack()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.'
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarSide} onPress={() => navigation.goBack()}>
          <CaretLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.topBarSide} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.accentAmber} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              placeholderTextColor={COLORS.textMuted}
              maxLength={50}
              autoCapitalize="words"
            />
            <Text style={styles.counter}>{displayName.length}/50</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us a little about yourself"
              placeholderTextColor={COLORS.textMuted}
              maxLength={200}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{bio.length}/200</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email ?? ''}
              editable={false}
              selectTextOnFocus={false}
              placeholder="Not available"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.hint}>Email cannot be changed.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  flex: { flex: 1 },
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
  saveButton: { color: COLORS.accentAmber, fontSize: 16, fontWeight: '700' },
  content: { padding: 24, alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.accentAmber },
  field: { width: '100%', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  bioInput: { minHeight: 100, paddingTop: 16 },
  disabledInput: { color: COLORS.textMuted, backgroundColor: COLORS.bgElevated },
  counter: { fontSize: 12, color: COLORS.textMuted, textAlign: 'right', marginTop: 6 },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
})
