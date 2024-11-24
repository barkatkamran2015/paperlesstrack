import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import your screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import Notifications from './HomeItems/Notifications';
import SetBudget from './HomeItems/SetBudget';
import SetBills from './HomeItems/SetBills';
import ReceiptList from './components/ReceiptList';
import ReceiptDetail from './components/ReceiptDetail';
import CategoryPage from './components/CategoryPage';
import EditReceipt from './components/EditReceipt';
import GraphScreen from './screens/GraphScreen';
import UserProfile from './screens/UserProfile';
import EditProfile from './screens/EditProfile';
import ChangePassword from './screens/ChangePassword';
import CategoryDetail from './components/CategoryDetail'; // Correct path for CategoryDetail

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Define Home Stack
const HomeStack = () => (
  <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: true }}>
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ReceiptList" component={ReceiptList} options={{ title: 'Receipts' }} />
    <Stack.Screen name="ReceiptDetail" component={ReceiptDetail} options={{ title: 'Receipt Detail' }} />
    <Stack.Screen name="CategoryPage" component={CategoryPage} options={{ title: 'Select Category' }} />
    <Stack.Screen name="EditReceipt" component={EditReceipt} options={{ title: 'Edit Receipt' }} />
    <Stack.Screen name="SetBudget" component={SetBudget} options={{ title: 'Set Budget' }} />
    <Stack.Screen name="SetBills" component={SetBills} options={{ title: 'Set Bills' }} />
  </Stack.Navigator>
);

// Define Profile Stack to handle User Profile and Edit Profile screens
const ProfileStack = () => (
  <Stack.Navigator initialRouteName="UserProfile" screenOptions={{ headerShown: true }}>
    <Stack.Screen
      name="UserProfile"
      component={UserProfile}
      options={{ title: 'Profile', headerShown: false }}
    />
    <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: 'Edit Profile' }} />
    <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: 'Change Password' }} />
  </Stack.Navigator>
);

// Define the main tab navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName = 'circle';
        if (route.name === 'Home') iconName = 'home-outline';
        else if (route.name === 'Graph') iconName = 'chart-bar';
        else if (route.name === 'Categories') iconName = 'format-list-bulleted';
        else if (route.name === 'Profile') iconName = 'account-circle-outline';

        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6200EE',
      tabBarInactiveTintColor: '#A9A9A9',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} />
    <Tab.Screen name="Graph" component={GraphScreen} />
    <Tab.Screen name="Categories" component={CategoryPage} />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

// Main App component
const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />

          {/* Add CategoryDetail as a global screen */}
          <Stack.Screen
            name="CategoryDetail"
            component={CategoryDetail}
            options={{ title: 'Category Details' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
