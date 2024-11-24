import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const EditProfile = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [isEditable, setIsEditable] = useState(false); // Control editability

  useEffect(() => {
    async function fetchUserData() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          const userDoc = doc(firestore, 'users', user.uid);
          const userSnapshot = await getDoc(userDoc);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            setFirstName(userData.firstName || '');
            setLastName(userData.lastName || '');
            setDob(userData.dob || '');
            setAddress(userData.address || '');
            setGender(userData.gender || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const userDoc = doc(firestore, 'users', user.uid);
        await updateDoc(userDoc, {
          firstName,
          lastName,
          dob,
          address,
          gender,
        });
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditable(false); // Disable edit mode after saving
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={() => setIsEditable(!isEditable)} style={styles.editButton}>
          <Text style={styles.editButtonText}>{isEditable ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={[styles.input, !isEditable && styles.disabledInput]}
        value={firstName}
        onChangeText={setFirstName}
        editable={isEditable}
      />

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={[styles.input, !isEditable && styles.disabledInput]}
        value={lastName}
        onChangeText={setLastName}
        editable={isEditable}
      />

      <Text style={styles.label}>Date of Birth</Text>
      <TextInput
        style={[styles.input, !isEditable && styles.disabledInput]}
        value={dob}
        onChangeText={setDob}
        editable={isEditable}
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, !isEditable && styles.disabledInput]}
        value={address}
        onChangeText={setAddress}
        editable={isEditable}
      />

      <Text style={styles.label}>Gender</Text>
      <TextInput
        style={[styles.input, !isEditable && styles.disabledInput]}
        value={gender}
        onChangeText={setGender}
        editable={isEditable}
      />

      {isEditable && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#a0a0a0',
  },
  saveButton: {
    backgroundColor: '#6200EE',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfile;
