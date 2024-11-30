import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import Svg, { Circle, Path } from 'react-native-svg';
import { auth, createUserWithEmailAndPassword } from '../firebaseConfig'; // Import Firebase auth
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore methods
import { firestore } from '../firebaseConfig'; // Add this line


const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  const handleSignUp = async () => {
    if (!email || !password || !username) { // Validate username
        Alert.alert('Invalid Input', 'Email, password, and username are required.');
        return;
    }

    if (password.length < 6) {
        Alert.alert('Weak Password', 'Password must be at least 6 characters.');
        return;
    }

    try {
        // Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a Firestore document for the new user
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
            email: user.email,
            username: username, // Use the username entered by the user
            registrationDate: new Date().toISOString(), // Record the registration date
            lastLogin: new Date().toISOString(), // Record the last login
            income: 0, // Placeholder for income
        });

        Alert.alert('Registration Successful', 'Your account has been created.');
        navigation.navigate('Login');
    } catch (error) {
        let errorMessage = 'An unknown error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        }
        Alert.alert('Registration Failed', errorMessage);
    }
};


  return (
    <View style={styles.container}>
      {/* Background Shapes */}
      <Svg height="50%" width="100%" style={styles.svgBackground}>
        <Circle cx="30%" cy="20%" r="80" fill="rgba(255, 255, 255, 0.1)" />
        <Circle cx="70%" cy="30%" r="100" fill="rgba(255, 255, 255, 0.1)" />
        <Path
          d="M0,256 C128,128 256,0 512,128 L512,0 L0,0 Z"
          fill="rgba(255, 255, 255, 0.1)"
          scale="1.5"
          translateY="-150"
        />
      </Svg>

      <Text style={styles.title}>Paperless Track</Text>
      <Text style={styles.subtitle}>Please create an account to track your daily bills</Text>

      <View style={styles.inputContainer}>
  <TextInput
    style={styles.input}
    placeholder="Username"
    placeholderTextColor="#fff"
    value={username}
    onChangeText={setUsername}
    autoCapitalize="none"
  />
</View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#fff"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#fff"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={hidePassword}
        />
        <IconButton
          icon={hidePassword ? 'eye-off' : 'eye'}
          color="#fff"
          size={20}
          onPress={() => setHidePassword(!hidePassword)}
        />
      </View>

      <TouchableOpacity onPress={handleSignUp} style={styles.button}>
        <Text style={styles.buttonText}>SIGN UP</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.signupText}>
          Already have an account? <Text style={styles.signupLink}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7B61FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '50%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    marginTop: -50,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C81FF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    color: '#fff',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 100,
    marginBottom: 15,
  },
  buttonText: {
    color: '#7B61FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupText: {
    color: '#fff',
    marginTop: 10,
  },
  signupLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
