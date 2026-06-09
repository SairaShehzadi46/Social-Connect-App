import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { launchImageLibrary } from 'react-native-image-picker';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  bio: Yup.string().max(160, 'Bio must be at most 160 characters'),
});

const EditProfileScreen = ({ navigation }) => {
  const { user, updateProfile } = useContext(AuthContext);
  const [profilePic, setProfilePic] = useState(user?.profilePicture || null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleImagePick = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true, // For mock storage, we might just save base64 string or URI. Here we'll just save the local URI.
      quality: 0.8,
    };

    try {
      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Image Picker Error', result.errorMessage);
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        setProfilePic(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async (values) => {
    setIsUpdating(true);
    const result = await updateProfile({
      name: values.name,
      bio: values.bio,
      profilePicture: profilePic,
    });
    
    setIsUpdating(false);
    
    if (result.success) {
      navigation.goBack();
    } else {
      Alert.alert('Update Failed', result.error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.imageSection}>
        <View style={styles.imageContainer}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="person" size={50} color="#ccc" />
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.changeImageBtn} onPress={handleImagePick}>
          <Text style={styles.changeImageText}>Change Profile Photo</Text>
        </TouchableOpacity>
      </View>

      <Formik
        initialValues={{ name: user?.name || '', bio: user?.bio || '' }}
        validationSchema={ProfileSchema}
        onSubmit={handleSave}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, touched.name && errors.name ? styles.inputError : null]}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              value={values.name}
            />
            {touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, touched.bio && errors.bio ? styles.inputError : null]}
              onChangeText={handleChange('bio')}
              onBlur={handleBlur('bio')}
              value={values.bio}
              multiline
              numberOfLines={4}
              maxLength={160}
            />
            {touched.bio && errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSubmit} 
              disabled={isUpdating}
            >
              {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
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
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageBtn: {
    padding: 5,
  },
  changeImageText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 15,
    marginTop: -10,
  },
  saveButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
