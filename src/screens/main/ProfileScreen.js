import React, { useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { PostContext } from '../../context/PostContext';
import Icon from 'react-native-vector-icons/Ionicons';
import PostCard from '../../components/PostCard';

const ProfileScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { posts, toggleLike } = useContext(PostContext);

  const myPosts = posts.filter(post => post.authorId === user?.id);

  const handleLike = useCallback((postId) => {
    toggleLike(postId);
  }, [toggleLike]);

  const handleComment = useCallback((postId) => {
    navigation.navigate('Comments', { postId });
  }, [navigation]);

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="person" size={50} color="#ccc" />
            </View>
          )}
        </View>
        
        <Text style={styles.name}>{user?.name || 'User Name'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        {user?.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : (
          <Text style={styles.noBio}>No bio provided.</Text>
        )}

        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{myPosts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <TouchableOpacity 
          style={styles.statBox} 
          onPress={() => navigation.navigate('FollowList', { userId: user.id, type: 'followers' })}
        >
          <Text style={styles.statNumber}>{user?.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statBox} 
          onPress={() => navigation.navigate('FollowList', { userId: user.id, type: 'following' })}
        >
          <Text style={styles.statNumber}>{user?.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={handleLike} 
            onComment={handleComment}
            onProfilePress={() => {}} // Already on own profile
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
    width: 120,
    height: 120,
    borderRadius: 60,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  bio: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  noBio: {
    fontSize: 16,
    color: '#aaa',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  editButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
});

export default ProfileScreen;
