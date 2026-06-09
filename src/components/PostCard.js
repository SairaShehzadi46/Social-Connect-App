import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, runOnJS } from 'react-native-reanimated';
import { responsiveHeight, responsiveWidth, responsiveFontSize } from 'react-native-responsive-dimensions';
import { formatRelativeTime } from '../utils/timeUtils';
import { AuthContext } from '../context/AuthContext';
import { PostContext } from '../context/PostContext';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

const PostCard = React.memo(({ post, onLike, onComment, onProfilePress }) => {
  const { user } = useContext(AuthContext);
  const { deletePost } = useContext(PostContext);
  const navigation = useNavigation();
  const isLikedByMe = post.likes.includes(user?.id);
  const isAuthor = user?.id === post.authorId;
  
  // Animation scale value
  const scale = useSharedValue(1);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleLikePress = () => {
    // Trigger animation
    scale.value = withSequence(
      withSpring(1.5, { damping: 2, stiffness: 150 }),
      withSpring(1, { damping: 2, stiffness: 150 })
    );
    // Call original function
    onLike(post.id);
  };

  const handleOptions = () => {
    if (!isAuthor) return;
    Alert.alert(
      "Post Options",
      "What would you like to do?",
      [
        { text: "Edit", onPress: () => navigation.navigate('EditPost', { post }) },
        { text: "Delete", onPress: () => deletePost(post.id), style: "destructive" },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Header: User Info */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={() => onProfilePress(post.authorId)}>
          {post.authorPic ? (
            <Image source={{ uri: post.authorPic }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Icon name="person" size={responsiveFontSize(2.5)} color="#fff" />
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <Text style={styles.timestamp}>{formatRelativeTime(post.timestamp)}</Text>
          </View>
        </TouchableOpacity>
        {isAuthor && (
          <TouchableOpacity onPress={handleOptions}>
            <Icon name="ellipsis-horizontal" size={responsiveFontSize(2.5)} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Body: Text and Image */}
      <View style={styles.body}>
        {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}
        {post.image ? (
          <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
        ) : null}
      </View>

      {/* Footer: Actions */}
      <View style={styles.footer}>
        <Pressable style={styles.actionButton} onPress={handleLikePress}>
          <Animated.View style={animatedIconStyle}>
            <Icon 
              name={isLikedByMe ? "heart" : "heart-outline"} 
              size={responsiveFontSize(3)} 
              color={isLikedByMe ? "#ff3b30" : "#666"} 
            />
          </Animated.View>
          <Text style={[styles.actionText, isLikedByMe && { color: '#ff3b30' }]}>
            {post.likes.length}
          </Text>
        </Pressable>

        <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post.id)}>
          <Icon name="chatbubble-outline" size={responsiveFontSize(2.8)} color="#666" />
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share-outline" size={responsiveFontSize(3)} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo to prevent unnecessary re-renders
  // Only re-render if the post object itself changed (likes, comments, etc)
  return (
    prevProps.post.likes.length === nextProps.post.likes.length &&
    prevProps.post.comments.length === nextProps.post.comments.length &&
    prevProps.post.id === nextProps.post.id
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: responsiveHeight(1.5),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    marginRight: responsiveWidth(2.5),
  },
  placeholderAvatar: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveWidth(2.5),
  },
  authorName: {
    fontSize: responsiveFontSize(2),
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: responsiveFontSize(1.5),
    color: '#999',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: responsiveHeight(1.5),
  },
  postText: {
    fontSize: responsiveFontSize(2),
    color: '#333',
    lineHeight: responsiveFontSize(2.8),
    marginBottom: responsiveHeight(1.2),
  },
  postImage: {
    width: '100%',
    height: responsiveHeight(30),
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: responsiveHeight(1.2),
    paddingHorizontal: responsiveWidth(4),
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveWidth(1),
  },
  actionText: {
    marginLeft: responsiveWidth(1.5),
    fontSize: responsiveFontSize(1.8),
    color: '#666',
    fontWeight: '500',
  },
});

export default PostCard;
