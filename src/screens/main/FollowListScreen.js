import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const FollowListScreen = ({ route, navigation }) => {
  const { userId, type } = route.params; // type is 'followers' or 'following'
  const { user: currentUser, getUserDetails, toggleFollow } = useContext(AuthContext);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListUsers = useCallback(async () => {
    setLoading(true);
    const userProfile = await getUserDetails(userId);
    if (!userProfile) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const targetIds = type === 'followers' 
      ? (userProfile.followers || []) 
      : (userProfile.following || []);

    const loadedUsers = [];
    for (const id of targetIds) {
      const details = await getUserDetails(id);
      if (details) {
        loadedUsers.push(details);
      }
    }
    setUsers(loadedUsers);
    setLoading(false);
  }, [userId, type, getUserDetails]);

  useEffect(() => {
    navigation.setOptions({ title: type === 'followers' ? 'Followers' : 'Following' });
    fetchListUsers();
  }, [navigation, type, fetchListUsers]);

  const handleAction = async (targetId) => {
    const res = await toggleFollow(targetId);
    if (res.success) {
      // Refresh list to update UI buttons and counts
      fetchListUsers();
    }
  };

  const renderUserItem = ({ item }) => {
    const isSelf = currentUser?.id === item.id;
    const isFollowing = currentUser?.following?.includes(item.id);
    const isFollowedByThem = currentUser?.followers?.includes(item.id);

    return (
      <View style={styles.userItem}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => {
            if (isSelf) {
              navigation.navigate('Profile');
            } else {
              navigation.navigate('UserProfile', { userId: item.id });
            }
          }}
        >
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Icon name="person" size={20} color="#fff" />
            </View>
          )}
          <View style={styles.textDetails}>
            <Text style={styles.name}>{item.name}</Text>
            {item.bio ? <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text> : null}
          </View>
        </TouchableOpacity>

        {!isSelf && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isFollowing ? styles.followingButton : styles.followButton
            ]}
            onPress={() => handleAction(item.id)}
          >
            <Text style={[
              styles.actionButtonText,
              isFollowing ? styles.followingButtonText : styles.followButtonText
            ]}>
              {isFollowing ? 'Following' : (isFollowedByThem ? 'Follow Back' : 'Follow')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  placeholderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textDetails: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bio: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 105,
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#007AFF',
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  followButtonText: {
    color: '#fff',
  },
  followingButtonText: {
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
});

export default FollowListScreen;
