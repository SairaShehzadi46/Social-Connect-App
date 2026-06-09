import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen = () => {
  const { logout, user } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.item}>
          <Text style={styles.itemText}>Email</Text>
          <Text style={styles.itemValue}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Icon name="notifications-outline" size={20} color="#007AFF" style={styles.itemIcon} />
            <Text style={styles.itemText}>Notifications</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Icon name="shield-checkmark-outline" size={20} color="#007AFF" style={styles.itemIcon} />
            <Text style={styles.itemText}>Privacy</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 15,
    marginTop: 15,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  itemValue: {
    fontSize: 16,
    color: '#999',
  },
  logoutButton: {
    marginTop: 40,
    marginHorizontal: 20,
    backgroundColor: '#ff3b30',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
