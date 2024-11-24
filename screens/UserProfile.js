import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Alert } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const UserProfile = ({ navigation }) => {
    const placeholderImage = require('../assets/placeholder-profile.png');
    const waveImage = require('../assets/user-profile.png');
    const [profileImage, setProfileImage] = useState(placeholderImage);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        async function fetchUserData() {
            try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (user) {
                    const displayName = user.displayName;
                    if (displayName) {
                        setUserName(displayName);
                        if (user.photoURL) {
                            setProfileImage({ uri: user.photoURL });
                        }
                    } else {
                        const userDoc = doc(firestore, 'users', user.uid);
                        const userSnapshot = await getDoc(userDoc);
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.data();
                            setUserName(userData.username || 'User');
                            if (userData.profilePicture) {
                                setProfileImage({ uri: userData.profilePicture });
                            }
                        } else {
                            console.log('No user document found');
                        }
                    }
                } else {
                    console.log('No user is signed in');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }

        fetchUserData();
    }, []);

    const handleImagePick = () => {
        const options = {
            mediaType: 'photo',
            quality: 1,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                Alert.alert('Error', response.errorMessage);
            } else {
                const source = { uri: response.assets[0].uri };
                setProfileImage(source);
            }
        });
    };

    const handleSignOut = async () => {
        try {
            const auth = getAuth();
            await auth.signOut();
            console.log('User signed out successfully');
            navigation.replace('Login'); // Navigate back to the login screen
        } catch (error) {
            console.error('Error signing out:', error.message);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground source={waveImage} style={styles.waveBackground} resizeMode="cover">
                <TouchableOpacity onPress={handleImagePick} style={styles.imageContainer}>
                    <Image source={profileImage} style={styles.profileImage} />
                    <Icon name="edit" size={20} color="#fff" style={styles.editIcon} />
                </TouchableOpacity>
                <Text style={styles.userName}>{userName || 'Loading...'}</Text>
                <Text style={styles.userRole}>{userName ? 'Welcome, ' + userName : 'Loading...'}</Text>
            </ImageBackground>

            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
                    <Icon name="person-outline" size={24} color="#6c63ff" />
                    <Text style={styles.menuText}>My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <Icon name="mail-outline" size={24} color="#6c63ff" />
                    <Text style={styles.menuText}>Messages</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>7</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <Icon name="favorite-outline" size={24} color="#6c63ff" />
                    <Text style={styles.menuText}>Favourites</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('ChangePassword')}
                >
                    <Icon name="lock-outline" size={24} color="#6c63ff" />
                    <Text style={styles.menuText}>Change Password</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <Icon name="logout" size={24} color="#d9534f" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

UserProfile.propTypes = {
    navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    waveBackground: {
        width: '100%',
        height: 500,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    imageContainer: {
        marginTop: 20,
        marginBottom: 10,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#fff',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 10,
        backgroundColor: '#6c63ff',
        borderRadius: 10,
        padding: 5,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    userRole: {
        fontSize: 16,
        color: '#fff',
    },
    menuContainer: {
        marginVertical: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ececec',
    },
    menuText: {
        fontSize: 18,
        marginLeft: 10,
        color: '#333',
    },
    badge: {
        backgroundColor: '#6c63ff',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 'auto',
    },
    badgeText: {
        color: '#fff',
        fontSize: 14,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#A020F0',
        borderRadius: 8,
        marginTop: 220,
    },
    logoutText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#fff',
    },
});

export default UserProfile;
