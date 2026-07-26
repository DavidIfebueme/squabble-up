import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { House, Bell, User } from 'phosphor-react-native'
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display'
import { PublicSans_400Regular, PublicSans_600SemiBold, PublicSans_700Bold } from '@expo-google-fonts/public-sans'
import HomeScreen from './src/screens/HomeScreen'
import DebateScreen from './src/screens/DebateScreen'
import CreateDebateScreen from './src/screens/CreateDebateScreen'
import DebateLobbyScreen from './src/screens/DebateLobbyScreen'
import PreDebateScreen from './src/screens/PreDebateScreen'
import DebateRoundScreen from './src/screens/DebateRoundScreen'
import BetweenRoundScreen from './src/screens/BetweenRoundScreen'
import GuestDebateScreen from './src/screens/GuestDebateScreen'
import ScoringScreen from './src/screens/ScoringScreen'
import VerdictScreen from './src/screens/VerdictScreen'
import VotingScreen from './src/screens/VotingScreen'
import AuthScreen from './src/screens/AuthScreen'
import SplashScreen from './src/screens/SplashScreen'
import OnboardingWelcomeScreen from './src/screens/OnboardingWelcomeScreen'
import OnboardingInterestsScreen from './src/screens/OnboardingInterestsScreen'
import OnboardingPersonaScreen from './src/screens/OnboardingPersonaScreen'
import EmailVerificationScreen from './src/screens/EmailVerificationScreen'
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen'
import TopicDetailScreen from './src/screens/TopicDetailScreen'
import SearchTopicsScreen from './src/screens/SearchTopicsScreen'
import TopicSuggestionScreen from './src/screens/TopicSuggestionScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import EditProfileScreen from './src/screens/EditProfileScreen'
import DebateHistoryScreen from './src/screens/DebateHistoryScreen'
import NotificationsScreen from './src/screens/NotificationsScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import CommunityGuidelinesScreen from './src/screens/CommunityGuidelinesScreen'
import ReportScreen from './src/screens/ReportScreen'
import BlockUserScreen from './src/screens/BlockUserScreen'
import AIScoringScreen from './src/screens/AIScoringScreen'
import GuestConversionScreen from './src/screens/GuestConversionScreen'
import DeepLinkLandingScreen from './src/screens/DeepLinkLandingScreen'
import { COLORS } from './src/lib/design'
import type { RootStackParamList } from './src/lib/types'

const Tab = createBottomTabNavigator()

export type AppStackParamList = RootStackParamList

const Stack = createNativeStackNavigator<AppStackParamList>()

const linking = {
  prefixes: ['squabbleup://'],
  config: {
    screens: {
      DebateLobby: 'debate/:debateId',
      Scoring: 'debate/:debateId/results',
      DebateRound: 'debate/:debateId/round/:roundNumber',
    },
  },
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgPrimary,
          borderTopColor: COLORS.borderSubtle,
          borderTopWidth: 1,
          height: 64,
        },
        tabBarActiveTintColor: COLORS.accentAmber,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Public Sans', marginBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <House color={color} size={size} weight="bold" />,
        }}
      />
      <Tab.Screen
        name="Activity"
        component={DebateScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} weight="bold" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} weight="bold" />,
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({ DMSerifDisplay_400Regular, PublicSans_400Regular, PublicSans_600SemiBold, PublicSans_700Bold })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary }}>
        <ActivityIndicator size="large" color={COLORS.accentAmber} />
      </View>
    )
  }

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
        <Stack.Screen name="OnboardingInterests" component={OnboardingInterestsScreen} />
        <Stack.Screen name="OnboardingPersona" component={OnboardingPersonaScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Main" component={HomeTabs} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateDebate" component={CreateDebateScreen} />
        <Stack.Screen name="DebateLobby" component={DebateLobbyScreen} />
        <Stack.Screen name="PreDebate" component={PreDebateScreen} />
        <Stack.Screen name="DebateRound" component={DebateRoundScreen} />
        <Stack.Screen name="BetweenRound" component={BetweenRoundScreen} />
        <Stack.Screen name="GuestDebate" component={GuestDebateScreen} />
        <Stack.Screen name="Scoring" component={ScoringScreen} />
        <Stack.Screen name="Verdict" component={VerdictScreen} />
        <Stack.Screen name="Voting" component={VotingScreen} />
        <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
        <Stack.Screen name="SearchTopics" component={SearchTopicsScreen} />
        <Stack.Screen name="TopicSuggestion" component={TopicSuggestionScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="DebateHistory" component={DebateHistoryScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen name="AIScoring" component={AIScoringScreen} />
        <Stack.Screen name="GuestConversion" component={GuestConversionScreen} />
        <Stack.Screen name="DeepLinkLanding" component={DeepLinkLandingScreen} />
        <Stack.Screen name="BlockUser" component={BlockUserScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
