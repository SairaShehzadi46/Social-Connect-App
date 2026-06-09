import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatListScreen = ({ navigation }) => {
  const { user, getUserDetails } = useContext(AuthContext);
  const [chatUsers, setChatUsers] = useState([]);

  useEffect(() => {
    // For simplicity, we'll list everyone the user is following or who is following the user
    const loadChatUsers = async () => {
      if (!user) return;
      const combinedIds = [...new Set([...(user.following || []), ...(user.followers || [])])];
      
      const users = [];
      for (const id of combinedIds) {
        const details = await getUserDetails(id);
        if (details) users.push(details);
      }
      setChatUsers(users);
    };

    loadChatUsers();
  }, [user, getUserDetails]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatRoom', { otherUserId: item.id, otherUserName: item.name })}
    >
      {item.profilePicture ? (
        <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholderAvatar}>
          <Icon name="person" size={24} color="#ccc" />
        </View>
      )}
      <View style={styles.chatInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.subtext}>Tap to chat</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {chatUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet.</Text>
          <Text style={styles.emptySubtext}>Follow someone to start chatting!</Text>
        </View>
      ) : (
        <FlatList
          data={chatUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
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
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
});

export default ChatListScreen;
