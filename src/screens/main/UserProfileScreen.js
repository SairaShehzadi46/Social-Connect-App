import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PostContext } from '../../context/PostContext';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import PostCard from '../../components/PostCard';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { posts, toggleLike } = useContext(PostContext);
  const { user: currentUser, toggleFollow, getUserDetails } = useContext(AuthContext);

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const details = await getUserDetails(userId);
      setProfileUser(details);
      setLoading(false);
    };
    fetchUser();
  }, [userId, getUserDetails]);

  const userPosts = posts.filter(post => post.authorId === userId);

  const handleLike = (postId) => {
    toggleLike(postId);
  };

  const handleComment = (postId) => {
    navigation.navigate('Comments', { postId });
  };

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    const result = await toggleFollow(userId);
    if (result.success) {
      // Re-fetch to update counts on screen
      const details = await getUserDetails(userId);
      setProfileUser(details);
    }
  };

  const isCurrentUser = currentUser?.id === userId;
  const isFollowing = currentUser?.following?.includes(userId);
  const isFollowedByThem = currentUser?.followers?.includes(userId);

  const renderHeader = () => {
    if (!profileUser) return null;

    return (
      <View>
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {profileUser.profilePicture ? (
              <Image source={{ uri: profileUser.profilePicture }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name="person" size={50} color="#ccc" />
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{profileUser.name}</Text>
          {profileUser.bio ? <Text style={styles.bio}>{profileUser.bio}</Text> : null}

          {!isCurrentUser && (
            <TouchableOpacity 
              style={[
                styles.followButton, 
                isFollowing && styles.followingButton,
                (!isFollowing && isFollowedByThem) && styles.followBackButton
              ]}
              onPress={handleFollowToggle}
            >
              <Text style={[
                styles.followButtonText, 
                isFollowing && styles.followingButtonText,
                (!isFollowing && isFollowedByThem) && styles.followBackButtonText
              ]}>
                {isFollowing ? 'Unfollow' : (isFollowedByThem ? 'Follow Back' : 'Follow')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={() => navigation.navigate('FollowList', { userId: profileUser.id, type: 'followers' })}
          >
            <Text style={styles.statNumber}>{profileUser.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={() => navigation.navigate('FollowList', { userId: profileUser.id, type: 'following' })}
          >
            <Text style={styles.statNumber}>{profileUser.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={handleLike} 
            onComment={handleComment}
            onProfilePress={() => {}} // Already on this user's profile
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#eee',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 20,
  },
  followButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  followingButtonText: {
    color: '#333',
  },
  followBackButton: {
    backgroundColor: '#007AFF',
  },
  followBackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default UserProfileScreen;
