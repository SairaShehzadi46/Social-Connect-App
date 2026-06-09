import React, { useContext, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PostContext } from '../../context/PostContext';
import { AuthContext } from '../../context/AuthContext';
import PostCard from '../../components/PostCard';

const HomeScreen = ({ navigation }) => {
  const { posts, loading, toggleLike } = useContext(PostContext);
  const { user } = useContext(AuthContext);

  const feedPosts = React.useMemo(() => {
    if (!user) return posts;
    return posts.filter(post => post.authorId === user.id || user.following?.includes(post.authorId));
  }, [posts, user]);

  const handleLike = useCallback((postId) => {
    toggleLike(postId);
  }, [toggleLike]);

  const handleComment = useCallback((postId) => {
    navigation.navigate('Comments', { postId });
  }, [navigation]);

  const handleProfilePress = useCallback((userId) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

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
        data={feedPosts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {user ? 'Follow users to see their posts here.' : 'No posts available yet.'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={handleLike} 
            onComment={handleComment}
            onProfilePress={handleProfilePress}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
  },
});

export default HomeScreen;
