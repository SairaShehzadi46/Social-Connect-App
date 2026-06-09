import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { PostContext } from '../../context/PostContext';

const CreatePostScreen = ({ navigation }) => {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addPost } = useContext(PostContext);

  const handleImagePick = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !imageUri) {
      Alert.alert('Empty Post', 'Please add some text or an image.');
      return;
    }

    setIsSubmitting(true);
    const success = await addPost(text, imageUri);
    setIsSubmitting(false);

    if (success) {
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          style={[styles.postButton, (!text.trim() && !imageUri) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={isSubmitting || (!text.trim() && !imageUri)}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          multiline
          autoFocus
          value={text}
          onChangeText={setText}
        />

        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <Icon name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={handleImagePick}>
          <Icon name="image" size={24} color="#007AFF" />
          <Text style={styles.toolText}>Photo</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#a0cfff',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  input: {
    fontSize: 18,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    marginTop: 15,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  toolText: {
    marginLeft: 5,
    color: '#333',
    fontSize: 16,
  },
});

export default CreatePostScreen;
