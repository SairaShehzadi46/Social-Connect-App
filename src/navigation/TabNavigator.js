import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';

import HomeStackNavigator from './HomeStackNavigator';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import CommentsScreen from '../screens/main/CommentsScreen';
import SearchScreen from '../screens/main/SearchScreen';
import FollowListScreen from '../screens/main/FollowListScreen';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Comments" component={CommentsScreen} />
      <ProfileStack.Screen 
        name="FollowList" 
        component={FollowListScreen} 
        options={{ headerShown: true, headerBackTitle: 'Back' }} 
      />
    </ProfileStack.Navigator>
  );
};

const TabNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Icon name={iconName} size={size} color={color} />;
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
            return <Icon name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            if (user && user.profilePicture) {
              return (
                <Image 
                  source={{ uri: user.profilePicture }} 
                  style={{ 
                    width: size, 
                    height: size, 
                    borderRadius: size / 2, 
                    borderWidth: focused ? 2 : 0, 
                    borderColor: color 
                  }} 
                />
              );
            }
            iconName = focused ? 'person' : 'person-outline';
            return <Icon name={iconName} size={size} color={color} />;
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
            return <Icon name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ headerShown: true, title: 'Search' }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ headerShown: true, title: 'My Profile' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings', tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
