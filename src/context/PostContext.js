import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { io } from 'socket.io-client';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, storage } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const PostContext = createContext();

const samplePosts = [
  {
    id: 'sample-1',
    authorId: 'user-123',
    authorName: 'Ayesha Khan',
    authorPic: null,
    text: 'Just joined SocialConnect! Looking forward to sharing thoughts and connecting with everyone.',
    image: null,
    timestamp: Date.now() - 1000 * 60 * 30,
    likes: [],
    comments: [],
  },
  {
    id: 'sample-2',
    authorId: 'user-456',
    authorName: 'Bilal Ahmed',
    authorPic: null,
    text: 'Here is a quick update: my first post on SocialConnect! Let me know what you think.',
    image: null,
    timestamp: Date.now() - 1000 * 60 * 90,
    likes: [],
    comments: [],
  },
];

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const PostProvider = ({ children }) => {
  const { user, isMockMode } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  // Real-time chat listeners registry for Mock Mode
  const chatListeners = useRef({});

  // Helper function to upload image to Firebase Storage
  const uploadImage = async (uri, path) => {
    if (!uri) return null;
    if (isMockMode) return uri; // In mock mode, keep local URI
    
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('Firebase Storage upload failed:', error);
      return uri; // Fallback to local uri if storage upload fails
    }
  };

  // 1. Initial configuration and posts loading
  useEffect(() => {
    // Setup Notifee channel for Android
    const setupNotifications = async () => {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'socialconnect-default',
          name: 'SocialConnect Notifications',
          importance: AndroidImportance.HIGH,
        });
      }
      await notifee.requestPermission();
    };
    setupNotifications();

    if (isMockMode) {
      console.log('--- PostContext: RUNNING IN MOCK/OFFLINE MODE ---');
      setLoading(true);

      // Load mock posts from AsyncStorage
      const loadMockPosts = async () => {
        try {
          const storedPosts = await AsyncStorage.getItem('mock_posts');
          if (storedPosts) {
            setPosts(JSON.parse(storedPosts));
          } else {
            await AsyncStorage.setItem('mock_posts', JSON.stringify(samplePosts));
            setPosts(samplePosts);
          }
        } catch (err) {
          console.error('Failed to load mock posts', err);
          setPosts(samplePosts);
        } finally {
          setLoading(false);
        }
      };
      loadMockPosts();

      // Setup Socket.io connection if running
      const newSocket = io(SOCKET_URL, { autoConnect: false });
      newSocket.connect();
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to real-time socket server');
      });

      newSocket.on('initial_posts', (initialPosts) => {
        if (initialPosts && initialPosts.length > 0) {
          setPosts(prevPosts => {
            const merged = [...initialPosts, ...prevPosts];
            const unique = merged.filter((item, index, self) => self.findIndex(i => i.id === item.id) === index);
            AsyncStorage.setItem('mock_posts', JSON.stringify(unique)).catch(e => console.error(e));
            return unique;
          });
        }
      });

      newSocket.on('post_added', (newPost) => {
        setPosts(prevPosts => {
          const updated = [newPost, ...prevPosts.filter(p => p.id !== newPost.id)];
          AsyncStorage.setItem('mock_posts', JSON.stringify(updated)).catch(e => console.error(e));
          return updated;
        });
      });

      newSocket.on('post_updated', (updatedPost) => {
        setPosts(prevPosts => {
          const updated = prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p);
          AsyncStorage.setItem('mock_posts', JSON.stringify(updated)).catch(e => console.error(e));
          return updated;
        });
      });

      newSocket.on('post_deleted', (postId) => {
        setPosts(prevPosts => {
          const updated = prevPosts.filter(p => p.id !== postId);
          AsyncStorage.setItem('mock_posts', JSON.stringify(updated)).catch(e => console.error(e));
          return updated;
        });
      });

      return () => newSocket.disconnect();
    } else {
      // Real Firebase Firestore mode
      console.log('--- PostContext: RUNNING IN FIREBASE MODE ---');
      setLoading(true);
      const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const postsList = [];
        snapshot.forEach((snapshotDoc) => {
          postsList.push({ id: snapshotDoc.id, ...snapshotDoc.data() });
        });
        setPosts(postsList);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching posts from Firestore:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isMockMode]);

  // 2. Real-time Notifications Listener
  useEffect(() => {
    if (isMockMode) {
      if (!socket || !user) return;

      const handleNotification = async (data) => {
        if (data.recipientId === user.id) {
          await notifee.displayNotification({
            title: 'SocialConnect Activity',
            body: data.message,
            android: {
              channelId: 'socialconnect-default',
              smallIcon: 'ic_launcher',
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
            },
          });
        }
      };

      socket.on('notification', handleNotification);
      return () => {
        socket.off('notification', handleNotification);
      };
    } else {
      if (!user) return;

      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.id),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            
            // Only show if the notification is recent (created in the last 15 seconds)
            if (data.timestamp > Date.now() - 15000) {
              await notifee.displayNotification({
                title: 'SocialConnect Activity',
                body: data.message,
                android: {
                  channelId: 'socialconnect-default',
                  smallIcon: 'ic_launcher',
                  importance: AndroidImportance.HIGH,
                  pressAction: {
                    id: 'default',
                  },
                },
              });

              // Mark as read so it won't display again
              await updateDoc(doc(db, 'notifications', change.doc.id), { read: true });
            }
          }
        });
      });

      return () => unsubscribe();
    }
  }, [isMockMode, socket, user]);

  const addPost = async (text, imageUri) => {
    if (!user) return false;

    const newPost = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      authorId: user.id,
      authorName: user.name,
      authorPic: user.profilePicture,
      text,
      image: imageUri,
      timestamp: Date.now(),
      likes: [],
      comments: []
    };

    if (isMockMode) {
      // 1. Update state locally immediately
      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      // 2. Persist in AsyncStorage
      try {
        const storedPosts = await AsyncStorage.getItem('mock_posts');
        const postsList = storedPosts ? JSON.parse(storedPosts) : [];
        await AsyncStorage.setItem('mock_posts', JSON.stringify([newPost, ...postsList]));
      } catch (err) {
        console.error('Failed to save mock post', err);
      }

      // 3. Socket broadcast if connected
      if (socket && socket.connected) {
        socket.emit('add_post', newPost);
      }
      return true;
    } else {
      try {
        const postRef = doc(collection(db, 'posts'));
        let finalImage = null;

        if (imageUri) {
          finalImage = await uploadImage(imageUri, `posts/${postRef.id}_image`);
        }

        const firebasePost = {
          id: postRef.id,
          authorId: user.id,
          authorName: user.name,
          authorPic: user.profilePicture || null,
          text,
          image: finalImage,
          timestamp: Date.now(),
          likes: [],
          comments: []
        };

        await setDoc(postRef, firebasePost);
        return true;
      } catch (error) {
        console.error('Failed to add post in Firebase', error);
        return false;
      }
    }
  };

  const editPost = async (postId, text, imageUri) => {
    if (!user) return false;

    if (isMockMode) {
      // Update state locally
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          return { ...p, text, image: imageUri };
        }
        return p;
      }));

      // Update AsyncStorage
      try {
        const storedPosts = await AsyncStorage.getItem('mock_posts');
        if (storedPosts) {
          const postsList = JSON.parse(storedPosts);
          const updated = postsList.map(p => p.id === postId ? { ...p, text, image: imageUri } : p);
          await AsyncStorage.setItem('mock_posts', JSON.stringify(updated));
        }
      } catch (err) {
        console.error(err);
      }

      if (socket && socket.connected) {
        socket.emit('edit_post', { postId, text, image: imageUri });
      }
      return true;
    } else {
      try {
        const postRef = doc(db, 'posts', postId);
        let finalImage = imageUri;

        if (imageUri && !imageUri.startsWith('http')) {
          finalImage = await uploadImage(imageUri, `posts/${postId}_image`);
        }

        await updateDoc(postRef, { text, image: finalImage });
        return true;
      } catch (error) {
        console.error('Failed to edit post in Firebase', error);
        return false;
      }
    }
  };

  const deletePost = async (postId) => {
    if (!user) return false;

    if (isMockMode) {
      // Update state locally
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));

      // Update AsyncStorage
      try {
        const storedPosts = await AsyncStorage.getItem('mock_posts');
        if (storedPosts) {
          const postsList = JSON.parse(storedPosts);
          const updated = postsList.filter(p => p.id !== postId);
          await AsyncStorage.setItem('mock_posts', JSON.stringify(updated));
        }
      } catch (err) {
        console.error(err);
      }

      if (socket && socket.connected) {
        socket.emit('delete_post', postId);
      }
      return true;
    } else {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        return true;
      } catch (error) {
        console.error('Failed to delete post in Firebase', error);
        return false;
      }
    }
  };

  const toggleLike = async (postId) => {
    if (!user) return;

    if (isMockMode) {
      let targetPost = null;
      
      // Update local state immediately
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likes.includes(user.id);
          const newLikes = hasLiked 
            ? post.likes.filter(id => id !== user.id) 
            : [...post.likes, user.id];
          
          targetPost = { ...post, likes: newLikes };
          return targetPost;
        }
        return post;
      }));

      // Save to AsyncStorage
      try {
        const storedPosts = await AsyncStorage.getItem('mock_posts');
        if (storedPosts) {
          const postsList = JSON.parse(storedPosts);
          const updated = postsList.map(p => {
            if (p.id === postId) {
              const hasLiked = p.likes.includes(user.id);
              const newLikes = hasLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id];
              return { ...p, likes: newLikes };
            }
            return p;
          });
          await AsyncStorage.setItem('mock_posts', JSON.stringify(updated));
        }
      } catch (err) {
        console.error(err);
      }

      // Trigger notification immediately in Mock Mode if we liked someone else's post
      if (targetPost && targetPost.likes.includes(user.id) && targetPost.authorId !== user.id) {
        try {
          await notifee.displayNotification({
            title: 'SocialConnect Activity',
            body: `${user.name} liked your post.`,
            android: {
              channelId: 'socialconnect-default',
              smallIcon: 'ic_launcher',
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
            },
          });
        } catch (e) {
          console.error('Failed to show like notification', e);
        }
      }

      // Socket sync if connected
      if (socket && socket.connected) {
        socket.emit('toggle_like', { postId, userId: user.id });
      }
    } else {
      try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        
        if (!postSnap.exists()) return;
        const postData = postSnap.data();
        const hasLiked = postData.likes.includes(user.id);

        if (hasLiked) {
          await updateDoc(postRef, { likes: arrayRemove(user.id) });
        } else {
          await updateDoc(postRef, { likes: arrayUnion(user.id) });

          // Send notification if liking someone else's post
          if (postData.authorId !== user.id) {
            const notificationRef = doc(collection(db, 'notifications'));
            await setDoc(notificationRef, {
              id: notificationRef.id,
              recipientId: postData.authorId,
              senderId: user.id,
              senderName: user.name,
              senderPic: user.profilePicture || null,
              type: 'like',
              postId: postId,
              message: `${user.name} liked your post.`,
              timestamp: Date.now(),
              read: false
            });
          }
        }
      } catch (error) {
        console.error('Failed to toggle like in Firebase', error);
      }
    }
  };

  const addComment = async (postId, text) => {
    if (!user || !text.trim()) return false;

    const newComment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      authorId: user.id,
      authorName: user.name,
      authorPic: user.profilePicture,
      text: text.trim(),
      timestamp: Date.now()
    };

    if (isMockMode) {
      let targetPost = null;

      // Update state locally immediately
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          targetPost = { ...post, comments: [...post.comments, newComment] };
          return targetPost;
        }
        return post;
      }));

      // Save to AsyncStorage
      try {
        const storedPosts = await AsyncStorage.getItem('mock_posts');
        if (storedPosts) {
          const postsList = JSON.parse(storedPosts);
          const updated = postsList.map(p => {
            if (p.id === postId) {
              return { ...p, comments: [...p.comments, newComment] };
            }
            return p;
          });
          await AsyncStorage.setItem('mock_posts', JSON.stringify(updated));
        }
      } catch (err) {
        console.error(err);
      }

      // Trigger notification immediately in Mock Mode if we commented on someone else's post
      if (targetPost && targetPost.authorId !== user.id) {
        try {
          await notifee.displayNotification({
            title: 'SocialConnect Activity',
            body: `${user.name} commented on your post: "${text.trim().substring(0, 30)}${text.trim().length > 30 ? '...' : ''}"`,
            android: {
              channelId: 'socialconnect-default',
              smallIcon: 'ic_launcher',
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
            },
          });
        } catch (e) {
          console.error(e);
        }
      }

      // Socket sync if connected
      if (socket && socket.connected) {
        socket.emit('add_comment', { postId, comment: newComment });
      }
      return true;
    } else {
      try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        
        if (!postSnap.exists()) return false;
        const postData = postSnap.data();

        const firebaseComment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          authorId: user.id,
          authorName: user.name,
          authorPic: user.profilePicture || null,
          text: text.trim(),
          timestamp: Date.now()
        };

        await updateDoc(postRef, { comments: arrayUnion(firebaseComment) });

        // Send notification if commenting on someone else's post
        if (postData.authorId !== user.id) {
          const notificationRef = doc(collection(db, 'notifications'));
          await setDoc(notificationRef, {
            id: notificationRef.id,
            recipientId: postData.authorId,
            senderId: user.id,
            senderName: user.name,
            senderPic: user.profilePicture || null,
            type: 'comment',
            postId: postId,
            message: `${user.name} commented on your post: "${text.trim().substring(0, 30)}${text.trim().length > 30 ? '...' : ''}"`,
            timestamp: Date.now(),
            read: false
          });
        }
        return true;
      } catch (error) {
        console.error('Failed to add comment in Firebase', error);
        return false;
      }
    }
  };

  const sendMessage = async (receiverId, text) => {
    if (!user) return;

    if (isMockMode) {
      const chatId = [user.id, receiverId].sort().join('_');
      const newMessage = {
        id: Date.now().toString(),
        chatId,
        senderId: user.id,
        receiverId,
        text: text.trim(),
        timestamp: Date.now()
      };

      // Store locally in AsyncStorage
      try {
        const storedMessages = await AsyncStorage.getItem(`mock_chat_${chatId}`);
        const messagesList = storedMessages ? JSON.parse(storedMessages) : [];
        const updated = [...messagesList, newMessage];
        await AsyncStorage.setItem(`mock_chat_${chatId}`, JSON.stringify(updated));
        
        // Notify any active room listener
        if (chatListeners.current[chatId]) {
          chatListeners.current[chatId].forEach(callback => callback(updated));
        }
      } catch (err) {
        console.error(err);
      }

      // Socket sync if connected
      if (socket && socket.connected) {
        const message = {
          senderId: user.id,
          receiverId,
          text,
          timestamp: Date.now()
        };
        socket.emit('send_message', message);
      }
    } else {
      try {
        const chatId = [user.id, receiverId].sort().join('_');
        const messageRef = doc(collection(db, 'messages'));
        const newMessage = {
          id: messageRef.id,
          chatId,
          senderId: user.id,
          receiverId,
          text: text.trim(),
          timestamp: Date.now()
        };

        await setDoc(messageRef, newMessage);

        // Send push notification trigger document
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          id: notificationRef.id,
          recipientId: receiverId,
          senderId: user.id,
          senderName: user.name,
          senderPic: user.profilePicture || null,
          type: 'message',
          message: `New message from ${user.name}: "${text.trim().substring(0, 30)}${text.trim().length > 30 ? '...' : ''}"`,
          timestamp: Date.now(),
          read: false
        });
      } catch (error) {
        console.error('Failed to send message in Firebase', error);
      }
    }
  };

  const getChatHistory = (otherUserId, callback) => {
    if (!user) return () => {};

    const chatId = [user.id, otherUserId].sort().join('_');

    if (isMockMode) {
      // Load initial chat history from storage
      AsyncStorage.getItem(`mock_chat_${chatId}`).then(stored => {
        const messagesList = stored ? JSON.parse(stored) : [];
        callback(messagesList);
      });

      // Register listener callback for instant updates
      if (!chatListeners.current[chatId]) {
        chatListeners.current[chatId] = [];
      }
      chatListeners.current[chatId].push(callback);

      // Handle socket real-time messages
      let handleReceive;
      if (socket) {
        handleReceive = (data) => {
          if (data.chatId === chatId) {
            AsyncStorage.getItem(`mock_chat_${chatId}`).then(stored => {
              const messagesList = stored ? JSON.parse(stored) : [];
              callback(messagesList);
            });
          }
        };
        socket.on('receive_message', handleReceive);
      }

      // Return unsubscribe cleanup function
      return () => {
        if (chatListeners.current[chatId]) {
          chatListeners.current[chatId] = chatListeners.current[chatId].filter(cb => cb !== callback);
        }
        if (socket && handleReceive) {
          socket.off('receive_message', handleReceive);
        }
      };
    } else {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesList = [];
        snapshot.forEach((snapshotDoc) => {
          messagesList.push(snapshotDoc.data());
        });
        callback(messagesList);
      }, (error) => {
        console.error('Error listening to chat history:', error);
      });

      return unsubscribe;
    }
  };

  return (
    <PostContext.Provider value={{
      posts,
      loading,
      addPost,
      toggleLike,
      addComment,
      socket,
      sendMessage,
      getChatHistory,
      editPost,
      deletePost,
      uploadImage
    }}>
      {children}
    </PostContext.Provider>
  );
};
