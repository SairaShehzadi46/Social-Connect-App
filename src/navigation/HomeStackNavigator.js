import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/main/HomeScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import EditPostScreen from '../screens/main/EditPostScreen';
import CommentsScreen from '../screens/main/CommentsScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import FollowListScreen from '../screens/main/FollowListScreen';

const HomeStack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeFeed" 
        component={HomeScreen} 
        options={({ navigation }) => ({
          title: 'SocialConnect',
          headerTitleStyle: { color: '#007AFF', fontWeight: 'bold' },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={{ paddingRight: 15 }}>
                <Icon name="chatbubbles-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Settings')} style={{ paddingRight: 15 }}>
                <Icon name="settings-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <HomeStack.Screen 
        name="CreatePost" 
        component={CreatePostScreen} 
        options={{ presentation: 'modal', headerShown: false }} 
      />
      <HomeStack.Screen 
        name="Comments" 
        component={CommentsScreen} 
        options={{ title: 'Comments', headerBackTitle: 'Back' }} 
      />
      <HomeStack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
        options={{ title: 'Profile', headerBackTitle: 'Back' }} 
      />
      <HomeStack.Screen 
        name="FollowList" 
        component={FollowListScreen} 
        options={{ title: 'People', headerBackTitle: 'Back' }} 
      />
      <HomeStack.Screen 
        name="EditPost" 
        component={EditPostScreen} 
        options={{ presentation: 'modal', headerShown: false }} 
      />
      <HomeStack.Screen 
        name="ChatList" 
        component={ChatListScreen} 
        options={{ title: 'Messages', headerBackTitle: 'Back' }} 
      />
      <HomeStack.Screen 
        name="ChatRoom" 
        component={ChatRoomScreen} 
        options={{ headerBackTitle: 'Back' }} 
      />
    </HomeStack.Navigator>
  );
};

export default HomeStackNavigator;
