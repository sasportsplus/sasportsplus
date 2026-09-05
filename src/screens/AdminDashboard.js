import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSportsData } from '../context/SportsDataContext';

export default function AdminDashboard({ navigation, onLogout }) {
  const { teams, matches, loading } = useSportsData();
  const [refreshing, setRefreshing] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    getAdminEmail();
  }, []);

  const getAdminEmail = async () => {
    try {
      const email = await AsyncStorage.getItem('adminEmail');
      setAdminEmail(email);
    } catch (error) {
      console.error('Error getting admin email:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const performLogout = async () => {
    try {
      await AsyncStorage.removeItem('adminLoggedIn');
      await AsyncStorage.removeItem('adminEmail');
      onLogout();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Are you sure you want to logout?')) {
        performLogout();
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: performLogout,
      },
    ]);
  };

  const getUpcomingMatches = () => {
    const today = new Date();
    return matches.filter((match) => new Date(match.date) >= today).length;
  };

  const getCompletedMatches = () => {
    return matches.filter((match) => match.status === 'Completed').length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome Admin!</Text>
            <Text style={styles.adminEmail}>{adminEmail}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{teams.length}</Text>
            <Text style={styles.statLabel}>Total Teams</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{matches.length}</Text>
            <Text style={styles.statLabel}>Total Matches</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getUpcomingMatches()}</Text>
            <Text style={styles.statLabel}>Upcoming Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getCompletedMatches()}</Text>
            <Text style={styles.statLabel}>Completed Matches</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TeamManagement', { screen: 'AddTeam' })}
          >
            <View style={styles.actionButtonIcon}>
              <Text style={styles.actionButtonIconText}>👥</Text>
            </View>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Add Team</Text>
              <Text style={styles.actionButtonDescription}>Create a new team</Text>
            </View>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MatchManagement', { screen: 'ScheduleMatch' })}
          >
            <View style={styles.actionButtonIcon}>
              <Text style={styles.actionButtonIconText}>🏆</Text>
            </View>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Schedule Match</Text>
              <Text style={styles.actionButtonDescription}>Create a new match</Text>
            </View>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TeamManagement', { screen: 'ViewTeams' })}
          >
            <View style={styles.actionButtonIcon}>
              <Text style={styles.actionButtonIconText}>📋</Text>
            </View>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>View Teams</Text>
              <Text style={styles.actionButtonDescription}>Manage all teams</Text>
            </View>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MatchManagement', { screen: 'ViewMatches' })}
          >
            <View style={styles.actionButtonIcon}>
              <Text style={styles.actionButtonIconText}>📅</Text>
            </View>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>View Matches</Text>
              <Text style={styles.actionButtonDescription}>View all scheduled matches</Text>
            </View>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>App Features</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Add and manage teams</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Schedule matches between teams</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Update match scores and status</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>View match history and statistics</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  adminEmail: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionButtonIconText: {
    fontSize: 24,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actionButtonArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  infoSection: {
    marginTop: 30,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  featureBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
});
