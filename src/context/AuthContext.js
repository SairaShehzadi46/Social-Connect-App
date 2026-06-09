import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, firebaseConfig } from '../config/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection
} from 'firebase/firestore';

export const AuthContext = createContext();

// Check if Firebase is using placeholder keys
const isMockMode = !auth || !db || firebaseConfig.apiKey === 'YOUR_API_KEY';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Print startup mode
  useEffect(() => {
    if (isMockMode) {
      console.log('--- AuthContext: RUNNING IN MOCK/OFFLINE MODE ---');
    } else {
      console.log('--- AuthContext: CONNECTED TO FIREBASE ---');
    }
  }, []);

  // Sync session auth state
  useEffect(() => {
    if (isMockMode) {
      // Offline/Mock mode session sync
      const loadUser = async () => {
        try {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (e) {
          console.error('Failed to load user', e);
        } finally {
          setLoading(false);
        }
      };
      loadUser();
    } else {
      // Firebase real-time auth state sync
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Fetch profile data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              setUser(userDoc.data());
            } else {
              // Create default document if it doesn't exist yet
              const defaultData = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                bio: '',
                profilePicture: null,
                following: [],
                followers: [],
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), defaultData);
              setUser(defaultData);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error loading user profile from Firebase', error);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const login = async (email, password) => {
    if (isMockMode) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const usersData = await AsyncStorage.getItem('users');
        const users = usersData ? JSON.parse(usersData) : [];
        const foundUser = users.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          const sessionUser = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            bio: foundUser.bio || '',
            profilePicture: foundUser.profilePicture || null,
            following: foundUser.following || [],
            followers: foundUser.followers || [],
          };
          await AsyncStorage.setItem('user', JSON.stringify(sessionUser));
          setUser(sessionUser);
          return { success: true };
        } else {
          return { success: false, error: 'Invalid email or password' };
        }
      } catch (e) {
        console.error(e);
        return { success: false, error: 'An error occurred during login' };
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        }
        return { success: true };
      } catch (error) {
        console.error(error);
        let errorMsg = 'An error occurred during login';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMsg = 'Invalid email or password';
        }
        return { success: false, error: errorMsg };
      }
    }
  };

  const signup = async (name, email, password) => {
    if (isMockMode) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const usersData = await AsyncStorage.getItem('users');
        const users = usersData ? JSON.parse(usersData) : [];
        
        if (users.find(u => u.email === email)) {
          return { success: false, error: 'Email already in use' };
        }

        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password,
          bio: '',
          profilePicture: null,
          following: [],
          followers: [],
        };
        
        users.push(newUser);
        await AsyncStorage.setItem('users', JSON.stringify(users));
        
        const sessionUser = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          bio: newUser.bio,
          profilePicture: newUser.profilePicture,
          following: [],
          followers: [],
        };
        await AsyncStorage.setItem('user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false, error: 'An error occurred during sign up' };
      }
    } else {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await firebaseUpdateProfile(userCredential.user, { displayName: name });
        
        const defaultData = {
          id: userCredential.user.uid,
          name,
          email,
          bio: '',
          profilePicture: null,
          following: [],
          followers: [],
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), defaultData);
        setUser(defaultData);
        return { success: true };
      } catch (error) {
        console.error(error);
        let errorMsg = 'An error occurred during sign up';
        if (error.code === 'auth/email-already-in-use') {
          errorMsg = 'Email already in use';
        }
        return { success: false, error: errorMsg };
      }
    }
  };

  const logout = async () => {
    if (isMockMode) {
      try {
        await AsyncStorage.removeItem('user');
        setUser(null);
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await signOut(auth);
        setUser(null);
      } catch (error) {
        console.error('Failed to log out', error);
      }
    }
  };

  const updateProfile = async (updates) => {
    if (isMockMode) {
      try {
        if (!user) return { success: false };
        const updatedUser = { ...user, ...updates };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        const usersData = await AsyncStorage.getItem('users');
        if (usersData) {
          const users = JSON.parse(usersData);
          const index = users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            await AsyncStorage.setItem('users', JSON.stringify(users));
          }
        }
        return { success: true };
      } catch (e) {
        console.error('Failed to update profile', e);
        return { success: false, error: 'Failed to update profile' };
      }
    } else {
      try {
        if (!user) return { success: false };
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, updates);
        setUser(prev => ({ ...prev, ...updates }));
        return { success: true };
      } catch (error) {
        console.error('Failed to update profile in Firebase', error);
        return { success: false, error: 'Failed to update profile' };
      }
    }
  };

  const toggleFollow = async (targetUserId) => {
    if (isMockMode) {
      try {
        if (!user) return { success: false };
        const usersData = await AsyncStorage.getItem('users');
        if (!usersData) return { success: false };

        let users = JSON.parse(usersData);
        const currentUserIndex = users.findIndex(u => u.id === user.id);
        const targetUserIndex = users.findIndex(u => u.id === targetUserId);

        if (currentUserIndex === -1 || targetUserIndex === -1) return { success: false };

        const currentUser = users[currentUserIndex];
        const targetUser = users[targetUserIndex];
        const isFollowing = currentUser.following?.includes(targetUserId);

        if (isFollowing) {
          currentUser.following = currentUser.following.filter(id => id !== targetUserId);
          targetUser.followers = targetUser.followers.filter(id => id !== user.id);
        } else {
          currentUser.following = [...(currentUser.following || []), targetUserId];
          targetUser.followers = [...(targetUser.followers || []), user.id];
        }

        users[currentUserIndex] = currentUser;
        users[targetUserIndex] = targetUser;
        await AsyncStorage.setItem('users', JSON.stringify(users));

        const updatedSessionUser = { ...user, following: currentUser.following, followers: currentUser.followers };
        await AsyncStorage.setItem('user', JSON.stringify(updatedSessionUser));
        setUser(updatedSessionUser);

        return { success: true, isFollowing: !isFollowing };
      } catch (e) {
        console.error('Failed to toggle follow', e);
        return { success: false };
      }
    } else {
      try {
        if (!user) return { success: false };
        const currentUserRef = doc(db, 'users', auth.currentUser.uid);
        const targetUserRef = doc(db, 'users', targetUserId);
        
        const isFollowing = user.following?.includes(targetUserId);

        if (isFollowing) {
          // Unfollow
          await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
          await updateDoc(targetUserRef, { followers: arrayRemove(auth.currentUser.uid) });
          setUser(prev => ({
            ...prev,
            following: prev.following.filter(id => id !== targetUserId)
          }));
          return { success: true, isFollowing: false };
        } else {
          // Follow
          await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
          await updateDoc(targetUserRef, { followers: arrayUnion(auth.currentUser.uid) });
          
          // Add follow notification
          const notificationRef = doc(collection(db, 'notifications'));
          await setDoc(notificationRef, {
            id: notificationRef.id,
            recipientId: targetUserId,
            senderId: auth.currentUser.uid,
            senderName: user.name,
            senderPic: user.profilePicture || null,
            type: 'follow',
            message: `${user.name} started following you.`,
            timestamp: Date.now(),
            read: false
          });

          setUser(prev => ({
            ...prev,
            following: [...(prev.following || []), targetUserId]
          }));
          return { success: true, isFollowing: true };
        }
      } catch (error) {
        console.error('Failed to toggle follow in Firebase', error);
        return { success: false };
      }
    }
  };

  const getUserDetails = async (userId) => {
    if (isMockMode) {
      try {
        const usersData = await AsyncStorage.getItem('users');
        if (usersData) {
          const users = JSON.parse(usersData);
          return users.find(u => u.id === userId) || null;
        }
        return null;
      } catch (e) {
        console.error(e);
        return null;
      }
    } else {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          return userDoc.data();
        }
        return null;
      } catch (error) {
        console.error('Failed to get user details from Firebase', error);
        return null;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, toggleFollow, getUserDetails, isMockMode }}>
      {children}
    </AuthContext.Provider>
  );
};
