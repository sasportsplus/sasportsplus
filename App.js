import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import AddTeamScreen from './src/screens/AddTeamScreen';
import ViewTeamsScreen from './src/screens/ViewTeamsScreen';
import ScheduleMatchScreen from './src/screens/ScheduleMatchScreen';
import ViewMatchesScreen from './src/screens/ViewMatchesScreen';
import EditTeamScreen from './src/screens/EditTeamScreen';
import TournamentPoolsScreen from './src/screens/TournamentPoolsScreen';
import EditMatchScreen from './src/screens/EditMatchScreen';

// Context
import { SportsDataProvider } from './src/context/SportsDataContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AdminTabNavigator = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      >
        {(screenProps) => (
          <AdminDashboard {...screenProps} onLogout={onLogout} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="TeamManagement"
        component={TeamManagementStack}
        options={{
          title: 'Teams',
          tabBarLabel: 'Teams',
        }}
      />
      <Tab.Screen
        name="MatchManagement"
        component={MatchManagementStack}
        options={{
          title: 'Matches',
          tabBarLabel: 'Matches',
        }}
      />
    </Tab.Navigator>
  );
};

const TeamManagementStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8f8f8',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ViewTeams"
        component={ViewTeamsScreen}
        options={{ title: 'Teams' }}
      />
      <Stack.Screen
        name="AddTeam"
        component={AddTeamScreen}
        options={{ title: 'Add Team' }}
      />
      <Stack.Screen
        name="EditTeam"
        component={EditTeamScreen}
        options={{ title: 'Edit Team' }}
      />
      <Stack.Screen
        name="TournamentPools"
        component={TournamentPoolsScreen}
        options={{ title: 'Tournament Pools' }}
      />
    </Stack.Navigator>
  );
};

const MatchManagementStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8f8f8',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ViewMatches"
        component={ViewMatchesScreen}
        options={{ title: 'Matches' }}
      />
      <Stack.Screen
        name="ScheduleMatch"
        component={ScheduleMatchScreen}
        options={{ title: 'Schedule Match' }}
      />
      <Stack.Screen
        name="EditMatch"
        component={EditMatchScreen}
        options={{ title: 'Edit Match' }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminLogin();
  }, []);

  const checkAdminLogin = async () => {
    try {
      const adminSession = await AsyncStorage.getItem('adminLoggedIn');
      setIsLoggedIn(adminSession === 'true');
    } catch (error) {
      console.error('Error checking admin session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <SportsDataProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isLoggedIn ? (
            <Stack.Screen
              name="Login"
              options={{
                animationEnabled: false,
              }}
            >
              {(screenProps) => (
                <LoginScreen
                  {...screenProps}
                  onLogin={() => setIsLoggedIn(true)}
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen
              name="AdminTabs"
              options={{
                animationEnabled: false,
              }}
            >
              {(screenProps) => (
                <AdminTabNavigator
                  {...screenProps}
                  onLogout={() => setIsLoggedIn(false)}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SportsDataProvider>
  );
}
