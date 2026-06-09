import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PostContext } from '../../context/PostContext';
import { formatRelativeTime } from '../../utils/timeUtils';

const CommentsScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const { posts, addComment } = useContext(PostContext);
  const [commentText, setCommentText] = useState('');

  const post = posts.find(p => p.id === postId);

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Post not found</Text>
      </View>
    );
  }

  const handleSend = async () => {
    if (commentText.trim()) {
      await addComment(postId, commentText);
      setCommentText('');
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      {item.authorPic ? (
        <Image source={{ uri: item.authorPic }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholderAvatar}>
          <Icon name="person" size={16} color="#fff" />
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={post.comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!commentText.trim()}
        >
          <Icon name="send" size={20} color={commentText.trim() ? "#007AFF" : "#a0cfff"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 15,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  placeholderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
  },
  sendButton: {
    padding: 10,
    marginLeft: 5,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommentsScreen;
