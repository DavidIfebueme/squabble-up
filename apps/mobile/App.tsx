import { StatusBar } from 'expo-status-bar'
import { Linking } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from './src/screens/HomeScreen'
import DebateScreen from './src/screens/DebateScreen'
import DebateLobbyScreen from './src/screens/DebateLobbyScreen'
import DebateRoundScreen, { type RootStackParamList } from './src/screens/DebateRoundScreen'
import CreateDebateScreen from './src/screens/CreateDebateScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import GuestDebateScreen from './src/screens/GuestDebateScreen'
import ScoringScreen from './src/screens/ScoringScreen'
import VotingScreen from './src/screens/VotingScreen'
import AuthScreen from './src/screens/AuthScreen'

const Tab = createBottomTabNavigator()

type AppStackParamList = RootStackParamList & {
  Main: undefined
  CreateDebate: undefined
  DebateLobby: { debateId: string; side?: string }
  GuestDebate: undefined
  Scoring: { debateId: string }
  Voting: { debateId: string }
  Auth: undefined
}

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
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Debates" component={DebateScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
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
