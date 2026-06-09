import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PostContext } from '../../context/PostContext';
import { AuthContext } from '../../context/AuthContext';
import PostCard from '../../components/PostCard';

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('users'); // 'users' or 'posts'
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  const { posts, toggleLike } = useContext(PostContext);
  const { user: currentUser, isMockMode } = useContext(AuthContext);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (isMockMode) {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const usersData = await AsyncStorage.getItem('users');
          if (usersData) {
            setUsers(JSON.parse(usersData));
          }
        } else {
          const { getDocs, collection } = require('firebase/firestore');
          const { db } = require('../../config/firebase');
          const querySnapshot = await getDocs(collection(db, 'users'));
          const usersList = [];
          querySnapshot.forEach((doc) => {
            usersList.push(doc.data());
          });
          setUsers(usersList);
        }
      } catch (e) {
        console.error('Failed to load users for search', e);
      }
    };
    loadUsers();
  }, [isMockMode]);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredUsers([]);
      setFilteredPosts([]);
      return;
    }

    const lowerQuery = query.toLowerCase();

    if (searchType === 'users') {
      const results = users.filter(u => 
        u.name.toLowerCase().includes(lowerQuery) || 
        (u.email && u.email.toLowerCase().includes(lowerQuery))
      );
      setFilteredUsers(results);
    } else {
      const results = posts.filter(p => 
        (p.text && p.text.toLowerCase().includes(lowerQuery)) ||
        (p.authorName && p.authorName.toLowerCase().includes(lowerQuery))
      );
      setFilteredPosts(results);
    }
  }, [query, searchType, users, posts]);

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('Home', { screen: 'UserProfile', params: { userId: item.id } })}
    >
      {item.profilePicture ? (
        <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholderAvatar}>
          <Icon name="person" size={20} color="#ccc" />
        </View>
      )}
      <View>
        <Text style={styles.userName}>{item.name}</Text>
        {item.bio ? <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${searchType}...`}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, searchType === 'users' && styles.activeTab]}
          onPress={() => setSearchType('users')}
        >
          <Text style={[styles.tabText, searchType === 'users' && styles.activeTabText]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, searchType === 'posts' && styles.activeTab]}
          onPress={() => setSearchType('posts')}
        >
          <Text style={[styles.tabText, searchType === 'posts' && styles.activeTabText]}>Posts</Text>
        </TouchableOpacity>
      </View>

      {query.trim().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="search-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Find people and posts</Text>
        </View>
      ) : searchType === 'users' ? (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListEmptyComponent={<Text style={styles.noResultsText}>No users found</Text>}
        />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard 
              post={item} 
              onLike={(postId) => toggleLike(postId)}
              onComment={(postId) => navigation.navigate('Home', { screen: 'Comments', params: { postId } })}
              onProfilePress={(userId) => navigation.navigate('Home', { screen: 'UserProfile', params: { userId } })}
            />
          )}
          ListEmptyComponent={<Text style={styles.noResultsText}>No posts found</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    margin: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#f5f5f5',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userBio: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#999',
  },
});

export default SearchScreen;
