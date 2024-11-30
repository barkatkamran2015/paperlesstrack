import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import Greeting from '../HomeItems/Greeting';
import FinancialHighlights from '../HomeItems/FinancialHighlights';
import BarChart from '../HomeItems/BarChart';
import RecentTransactions from '../HomeItems/RecentTransactions';
import Notifications from '../HomeItems/Notifications';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { addDoc, collection, getDocs, query,where, doc,onSnapshot, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import axios from 'axios';
import { getAuth } from "firebase/auth";

MaterialCommunityIcons.loadFont();

const HomeScreen = ({ navigation }) => {
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [manualEntryVisible, setManualEntryVisible] = useState(false);
    const [vendor, setVendor] = useState('');
    const [total, setTotal] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [userName, setUserName] = useState('User');
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [netSavings, setNetSavings] = useState(0);
    const [budgetUsed, setBudgetUsed] = useState(0);
    const [budget, setBudget] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [barChartData, setBarChartData] = useState({
        labels: [],
        datasets: [{ data: [] }],
    });

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
    
        if (user) {
            fetchUserName(user.uid);
            fetchBudget(user.uid); // Fetch the budget specific to the logged-in user
            fetchData(user.uid);   // Fetch user-specific receipts and other data
            const unsubscribe = subscribeToFirestoreUpdates(user.uid); // Subscribe to updates for this user
            return () => unsubscribe(); // Cleanup subscriptions on unmount or logout
        } else {
            console.log("No user is logged in.");
        }
    }, []);      

    const fetchUserName = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
    
            if (user) {
                const userUID = user.uid; // Get the dynamically logged-in user's UID
                const userDocRef = doc(firestore, 'users', userUID);
                console.log('Fetching document from Firestore:', userDocRef.path);
    
                const userSnapshot = await getDoc(userDocRef);
                console.log('Firestore snapshot:', userSnapshot);
    
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    console.log('User data:', userData);
    
                    // Use the username field instead of firstName and lastName
                    setUserName(userData.username || 'User');
                } else {
                    console.log('User document not found!');
                    setUserName('User');
                }
            } else {
                console.log('No user is signed in');
                setUserName('Guest');
            }
        } catch (error) {
            console.error('Error fetching user name:', error);
        }
    };
     

    // Subscribe to Firestore updates
    const subscribeToFirestoreUpdates = () => {
        // Listen to receipt updates
        const unsubscribeReceipts = onSnapshot(
            collection(firestore, "user_receipts"),
            (snapshot) => {
                const receiptList = snapshot.docs.map((doc) => doc.data());
    
                // Calculate financial metrics dynamically
                let totalExpensesCalc = 0;
                const categoryMap = {};
    
                receiptList.forEach(({ category, total }) => {
                    totalExpensesCalc += total;
                    categoryMap[category] = (categoryMap[category] || 0) + total;
                });
    
                // Update financial states
                const netSavingsCalc = budget - totalExpensesCalc;
                const budgetUsedCalc = Math.min((totalExpensesCalc / budget) * 100, 100);
    
                setTotalExpenses(totalExpensesCalc);
                setNetSavings(netSavingsCalc);
                setBudgetUsed(budgetUsedCalc.toFixed(2));
    
                // Update transactions
                setTransactions(receiptList);
            },
            (error) => {
                console.error("Error listening to user_receipts: ", error);
            }
        );
    
        // Listen to budget updates
        const unsubscribeBudgets = onSnapshot(
            collection(firestore, "budgets"),
            (snapshot) => {
                const notificationsList = [];
                snapshot.forEach((doc) => {
                    const budget = doc.data();
                    const spentPercentage = (totalExpenses / budget.amount) * 100;
    
                    // Notify when budget spent is >= 90%
                    if (spentPercentage >= 90 && spentPercentage < 100) {
                        notificationsList.push({
                            id: `${doc.id}-almostExceeded`,
                            type: "budgetWarning",
                            title: "Budget Almost Used!",
                            message: `You have used ${spentPercentage.toFixed(2)}% of your budget for ${budget.name}.`,
                        });
                    }
    
                    // Notify when budget is exceeded
                    if (spentPercentage >= 100) {
                        notificationsList.push({
                            id: `${doc.id}-exceeded`,
                            type: "budgetExceeded",
                            title: "Budget Exceeded!",
                            message: `You have exceeded your budget for ${budget.name} by ${(
                                totalExpenses - budget.amount
                            ).toFixed(2)}.`,
                        });
                    }
                });
    
                // Update notifications state
                setNotifications((prevNotifications) => [
                    ...prevNotifications.filter((n) => !n.type.startsWith("budget")),
                    ...notificationsList,
                ]);
            },
            (error) => {
                console.error("Error listening to budgets: ", error);
            }
        );
    
        // Cleanup function
        return () => {
            unsubscribeReceipts();
            unsubscribeBudgets();
        };
    };
    
const fetchData = async () => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.error("No user is logged in.");
            return;
        }

        const userId = user.uid; // Get the current user's ID

        // Query to fetch only the receipts and budgets for the logged-in user
        const receiptsQuery = query(
            collection(firestore, "user_receipts"),
            where("userId", "==", userId)
        );
        const budgetsQuery = query(
            collection(firestore, "budgets"),
            where("userId", "==", userId)
        );

        // Fetch data
        const receiptsSnapshot = await getDocs(receiptsQuery);
        const budgetsSnapshot = await getDocs(budgetsQuery);

        const receiptList = receiptsSnapshot.docs.map((doc) => doc.data());
        const budgets = budgetsSnapshot.docs.map((doc) => doc.data());
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

        let totalExpensesCalc = 0;
        const categoryMap = {};

        receiptList.forEach(({ category, total }) => {
            totalExpensesCalc += total;
            categoryMap[category] = (categoryMap[category] || 0) + total;
        });

        // Update bar chart data
        setBarChartData({
            labels: Object.keys(categoryMap),
            datasets: [{ data: Object.values(categoryMap) }],
        });

        // Calculate net savings and budget usage
        const netSavingsCalc = totalBudget - totalExpensesCalc;
        const budgetUsedCalc = Math.min((totalExpensesCalc / totalBudget) * 100, 100);

        // Update state
        setTotalExpenses(totalExpensesCalc);
        setNetSavings(netSavingsCalc);
        setBudgetUsed(budgetUsedCalc.toFixed(2));
        setTransactions(receiptList);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};
   
    const fetchBudget = async (userId) => {
        try {
            const budgetQuery = query(
                collection(firestore, "budgets"),
                where("userId", "==", userId)
            );
            const budgetSnapshot = await getDocs(budgetQuery);
    
            let totalBudget = 0;
            budgetSnapshot.forEach((doc) => {
                totalBudget += doc.data().amount;
            });
    
            setBudget(totalBudget);
        } catch (error) {
            console.error("Error fetching budget: ", error);
        }
    };
    

    const handleSaveManualEntry = async () => {
        // Input validation
        if (!vendor.trim() || !total.trim() || !category.trim() || !date.trim()) {
          Alert.alert('Error', 'Please fill in all fields.');
          return;
        }
      
        if (isNaN(parseFloat(total))) {
          Alert.alert('Error', 'Total must be a valid number.');
          return;
        }
      
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          Alert.alert('Error', 'Date must be in YYYY-MM-DD format.');
          return;
        }
      
        try {
          // Log the data being saved
          console.log("Saving to Firestore:", { vendor, total, category, date });
      
          // Save to Firestore
          await addDoc(collection(firestore, 'user_receipts'), {
            vendor,
            total: parseFloat(total),
            category,
            date,
          });
      
          Alert.alert('Success', 'Receipt added successfully.');
      
          // Reset inputs
          setVendor('');
          setTotal('');
          setCategory('');
          setDate('');
          setManualEntryVisible(false);
      
          // Refresh data
          fetchData();
        } catch (error) {
          console.error('Error saving receipt:', error);
          Alert.alert('Error', 'Failed to save receipt. Please try again.');
        }
      };

      const handleScanReceipt = async () => {
        launchCamera({ mediaType: 'photo' }, async (response) => {
            if (response.didCancel || response.errorCode) {
                Alert.alert('Error', 'Action cancelled or camera error.');
                return;
            }

            const formData = new FormData();
            formData.append('file', {
                uri: response.assets[0].uri,
                type: response.assets[0].type,
                name: response.assets[0].fileName,
            });

            try {
                const res = await axios.post('https://backend-s2qh.onrender.com/api/process-receipt', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                await addDoc(collection(firestore, 'user_receipts'), res.data);
                Alert.alert('Success', 'Receipt scanned and saved.');
                fetchData();
            } catch (error) {
                console.error('Error scanning receipt:', error);
                Alert.alert('Error', 'Could not process receipt.');
            }
        });
    };

    // Handle file upload
    const handleFileUpload = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles],
            });

            const formData = new FormData();
            formData.append('file', {
                uri: result[0].uri,
                type: result[0].type,
                name: result[0].name,
            });

            // Add predefined categories for uploading (can be dynamic if required)
            formData.append('categories', JSON.stringify(['Food', 'Travel', 'Office Supplies', 'Grocery', 'Toys', 'Clothes', 'Pharmacy']));

            const response = await axios.post('https://backend-s2qh.onrender.com/api/process-receipt', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log("API Response:", response.data); // Log the response to inspect data

            const receiptData = response.data;

            // Add the uploaded receipt to Firestore
            await addDoc(collection(firestore, 'user_receipts'), {
                vendor: receiptData.vendor || 'Unknown Vendor', // Fallback for vendor
                items: receiptData.items,
                total: receiptData.total,
                category: receiptData.category || 'Uncategorized', // Fallback for category
                date: receiptData.date || 'N/A',  // Fallback for date
            });

            Alert.alert('Success', 'Receipt processed successfully and added to Firestore', [
                { text: 'OK', onPress: () => navigation.navigate('ReceiptList') },
            ]);
        } catch (err) {
            console.error('File upload error:', err);
            Alert.alert('Error', 'An error occurred while uploading the file');
        }
    };
    
    const toggleFab = () => setIsFabOpen(!isFabOpen);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ListHeaderComponent={
                    <>
                        <Greeting userName={userName} />
                        <FinancialHighlights
                            totalExpenses={totalExpenses}
                            netSavings={netSavings}
                            budgetUsed={budgetUsed}
                        />
                        <BarChart data={barChartData} />
                        <RecentTransactions transactions={transactions} />
                    </>
                }
                ListFooterComponent={<Notifications notifications={notifications} />}
                data={[]}
                renderItem={null}
            />
            {/* Add ReceiptList button */}
            <TouchableOpacity
                style={styles.receiptsButton}
                onPress={() => navigation.navigate('ReceiptList')}>
                <Text style={styles.receiptsButtonText}>View Receipts</Text>
            </TouchableOpacity>

            <View style={styles.fabContainer}>
                {isFabOpen && (
                    <View style={styles.fabOptions}>
                        <TouchableOpacity
    style={styles.fabOption}
    onPress={() => setManualEntryVisible(true)} // Show the manual entry modal
>
    <MaterialCommunityIcons name="pencil" size={24} color="#6200EE" />
</TouchableOpacity>

{/* Manual Entry Modal */}
{manualEntryVisible && (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.manualEntryContainer}
    >
        <View style={styles.manualEntryContent}>
            <Text style={styles.manualEntryTitle}>Add Manual Entry</Text>

            {/* Use ScrollView to handle large inputs */}
            <ScrollView style={styles.modalScroll}>
                {/* Vendor Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Vendor"
                    value={vendor}
                    onChangeText={setVendor}
                />

                {/* Total Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Total"
                    keyboardType="numeric"
                    value={total}
                    onChangeText={setTotal}
                />

                {/* Category Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Category"
                    value={category}
                    onChangeText={setCategory}
                />

                {/* Date Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Date (YYYY-MM-DD)"
                    value={date}
                    onChangeText={setDate}
                />
            </ScrollView>
            {/* Save Button */}
            <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                    handleSaveManualEntry(); // Trigger the save logic
                    setIsFabOpen(false);
                }}
            >
                <Text style={styles.saveButtonText}>Save Entry</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setManualEntryVisible(false)} // Close the modal
            >
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
                )}
            <TouchableOpacity
                style={styles.fabOption}
                onPress={() => {
                    handleScanReceipt(); // Call the receipt scan function
                    setIsFabOpen(false); // Close the FAB menu
                }}
            >
                <MaterialCommunityIcons name="camera" size={24} color="#6200EE" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.fabOption}
                onPress= {()=> {
                    handleFileUpload();
                    setIsFabOpen(false);
                }}
            >
                <MaterialCommunityIcons name="file-upload" size={24} color="#6200EE" />
            </TouchableOpacity>
            </View>
                )}
                <TouchableOpacity
                    style={styles.fabButton}
                    onPress={toggleFab}
                >
                    <MaterialCommunityIcons name={isFabOpen ? 'close' : 'plus'} size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    fabContainer: { position: 'absolute', bottom: 20, alignSelf: 'center' },
    fabOptions: { flexDirection: 'row', marginBottom: 10 },
    fabOption: { backgroundColor: '#FFF', padding: 10, borderRadius: 30, marginHorizontal: 5 },
    fabButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 30, alignItems: 'center' },

    manualEntryContainer: {
        flex: 1,
        justifyContent: 'flex-end', // Align modal at the bottom
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    manualEntryContent: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '100%', // Increase the height of the modal
        maxHeight: '100%', // Ensure it doesn't exceed 80% of the screen
    },
    modalScroll: {
        flexGrow: 0, // Prevent excessive stretching
        marginBottom: 10, // Space below inputs
    },
    manualEntryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    input: {
        borderColor: '#CCC',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginVertical: 5,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#6200EE',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
    },
    cancelButton: {
        marginTop: 5,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#6200EE',
        fontSize: 16,
    },
    receiptsButton: {
        marginTop: 10,
        backgroundColor: '#03A9F4',
        paddingVertical: 15, // Adjust padding for better height control
        paddingHorizontal: 20, // Adjust padding for content width control
        borderRadius: 5,
        alignSelf: 'left', // Center the button horizontally
        width: '18%', // Set a percentage width to make the button shorter
    },
    receiptsButtonText: {
        color: '#fff',
        textAlign: 'left',
        fontWeight: '600',
    },
    
    fabContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        alignItems: 'center',
    },
    fabOptions: {
        alignItems: 'center',
        marginBottom: 15,
    },
    fabOptionCircle: {
        backgroundColor: '#FFFFFF',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    centerTab: {
        backgroundColor: '#6200EE',
        borderRadius: 30,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
});

export default HomeScreen;
