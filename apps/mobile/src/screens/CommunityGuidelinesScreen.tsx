import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
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
  CommunityGuidelines: undefined
}

type Props = NativeStackScreenProps<LocalStackParamList, 'CommunityGuidelines'>

export default function CommunityGuidelinesScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarSide} onPress={() => navigation.goBack()}>
          <CaretLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Community Guidelines</Text>
        <View style={styles.topBarSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Argue anything.{'\n'}Don't attack people.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keep it civil</Text>
          <Text style={styles.sectionBody}>
            Squabble Up is built for passionate debate. Disagree with ideas as fiercely as you like, but don't demean, harass, or threaten the person making them. Personal attacks, slurs, and intimidation erode the conversation for everyone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>No hate speech or harassment</Text>
          <Text style={styles.sectionBody}>
            We don't tolerate content that attacks people based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, or serious disease. This includes coded language, dog whistles, and coordinated harassment.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Be honest, not misleading</Text>
          <Text style={styles.sectionBody}>
            Make your case with evidence you believe is true. Don't spread intentional misinformation, fabricated quotes, or manipulated media. Cite sources when possible and be open to correction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>No spam or manipulation</Text>
          <Text style={styles.sectionBody}>
            Don't repeatedly post the same argument, flood debates, or use bots to manipulate voting, scoring, or audience feedback. Let the quality of your argument earn the win.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reporting and consequences</Text>
          <Text style={styles.sectionBody}>
            If you see a violation, report it. Our team reviews reports and may remove content, issue warnings, suspend accounts, or permanently ban repeat offenders. We aim to be fair and transparent, but safety comes first.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A note on consequences</Text>
          <Text style={styles.sectionBody}>
            Violating these guidelines can result in content removal, loss of ranking, temporary suspension, or permanent account termination. We reserve the right to take action we deem necessary to protect the community.
          </Text>
        </View>
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
  content: { padding: 24, paddingBottom: 48 },
  heading: {
    fontFamily: 'DM Serif Display',
    fontSize: 32,
    lineHeight: 40,
    color: COLORS.textPrimary,
    marginBottom: 32,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentAmber,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
})
