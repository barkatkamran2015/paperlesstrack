import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import Svg, { Circle, Path } from 'react-native-svg';
import { auth, signInWithEmailAndPassword } from '../firebaseConfig';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Login Successful', 'Welcome back!');
      // Navigate to the main tab navigator after successful login
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }], // Ensure 'MainTabs' is the correct navigator name in App.tsx
      });
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
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
      <Text style={styles.subtitle}>Please sign in to the app for tracking your daily bills</Text>

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

      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>SIGN IN</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.signupText}>
          Don’t have an account? <Text style={styles.signupLink}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

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
