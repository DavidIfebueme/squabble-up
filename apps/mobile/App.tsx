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
import DebateLobbyScreen from './src/screens/DebateLobbyScreen'
import DebateRoundScreen from './src/screens/DebateRoundScreen'
import CreateDebateScreen from './src/screens/CreateDebateScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import GuestDebateScreen from './src/screens/GuestDebateScreen'
import ScoringScreen from './src/screens/ScoringScreen'
import VotingScreen from './src/screens/VotingScreen'
import AuthScreen from './src/screens/AuthScreen'
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={HomeTabs} />
        <Stack.Screen name="CreateDebate" component={CreateDebateScreen} />
        <Stack.Screen name="DebateLobby" component={DebateLobbyScreen} />
        <Stack.Screen name="DebateRound" component={DebateRoundScreen} />
        <Stack.Screen name="GuestDebate" component={GuestDebateScreen} />
        <Stack.Screen name="Scoring" component={ScoringScreen} />
        <Stack.Screen name="Voting" component={VotingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
