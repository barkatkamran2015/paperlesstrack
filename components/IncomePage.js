import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { firestore } from '../firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getDoc } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';


const IncomePage = () => {
    const [incomes, setIncomes] = useState({});
    const [totalEarned, setTotalEarned] = useState(0);
    const [incomeSourceModalVisible, setIncomeSourceModalVisible] = useState(false); // For adding/updating income sources
    const [incomeSource, setIncomeSource] = useState(''); // Holds the name of the income source
    const [amount, setAmount] = useState(''); // Holds the entered amount for the income source
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, "incomes"), (snapshot) => {
            let updatedIncomes = {};
            let earned = 0;

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const sourceKey = data.category?.toLowerCase().trim() || 'other';
                const amount = data.total || 0;

                if (updatedIncomes[sourceKey]) {
                    updatedIncomes[sourceKey].total += amount;
                    updatedIncomes[sourceKey].count += 1;
                } else {
                    updatedIncomes[sourceKey] = {
                        total: amount,
                        count: 1,
                        icon: getIconForIncomeCategory(sourceKey),
                        color: getColorForIncomeCategory(sourceKey),
                        id: doc.id, // Store document ID for updating Firestore later
                    };
                }
                earned += amount;
            });

            setIncomes(updatedIncomes);
            setTotalEarned(earned);
        });

        return () => unsubscribe();
    }, []);

    const getIconForIncomeCategory = (category) => {
        switch (category) {
            case 'salary': return 'currency-usd';
            case 'freelance': return 'laptop';
            case 'investment': return 'chart-line';
            case 'other': return 'cash';
            default: return 'cash';
        }
    };

    const getColorForIncomeCategory = (category) => {
        switch (category) {
            case 'salary': return '#2196F3';
            case 'freelance': return '#9C27B0';
            case 'investment': return '#FF5722';
            case 'other': return '#4CAF50';
            default: return '#2196F3';
        }
    };

const handleAddOrUpdateIncomeSource = async () => {
    if (!incomeSource.trim() || !amount.trim()) {
        Alert.alert("Validation Error", "Please provide both an income source name and an amount.");
        return;
    }

    const sourceKey = incomeSource.toLowerCase().trim();
    const amountValue = parseFloat(amount);

    if (isNaN(amountValue) || amountValue <= 0) {
        Alert.alert("Validation Error", "Please enter a valid amount greater than zero.");
        return;
    }

    try {
        if (incomes[sourceKey]) {
            // Update existing income source
            const incomeDocRef = doc(firestore, "incomes", incomes[sourceKey].id);

            // Fetch the latest total from Firestore
            const incomeDocSnapshot = await getDoc(incomeDocRef); // Ensure getDoc is imported
            const existingTotal = incomeDocSnapshot.data()?.total || 0;

            const newTotal = existingTotal + amountValue; // Add the new amount to the existing total

            await updateDoc(incomeDocRef, {
                total: newTotal,
                count: incomes[sourceKey].count + 1,
            });
        } else {
            // Add a new income source
            await addDoc(collection(firestore, "incomes"), {
                category: sourceKey,
                total: amountValue,
                count: 1,
                icon: getIconForIncomeCategory(sourceKey),
                color: getColorForIncomeCategory(sourceKey),
            });
        }

        setIncomeSource('');
        setAmount('');
        setIncomeSourceModalVisible(false);
    } catch (error) {
        console.error("Error adding or updating income source:", error);
        Alert.alert("Error", "Failed to add or update income source");
    }
};

const handleCategoryClick = (category) => {
    navigation.navigate("CategoryDetail", { category }); // Pass category as a parameter
}; 

    const calculateNumColumns = () => {
        const screenWidth = Dimensions.get('window').width;
        return screenWidth >= 768 ? 3 : 2; // 3 columns for wider screens, 2 for smaller screens
    };

    return (
        <View>
            <Text style={styles.sectionHeader}>Total Earned: ${totalEarned.toFixed(2)}</Text>
            <FlatList
    data={Object.entries(incomes)} // Convert incomes object to an array for FlatList
    keyExtractor={([key]) => key} // Use category name as the unique key
    renderItem={({ item }) => {
        const [source, { total, count, icon, color }] = item; // Destructure category data

        return (
            <TouchableOpacity
                style={[styles.incomeItem, { borderColor: color }]} // Styling for each item
                onPress={() => handleCategoryClick(source)} // Navigate to CategoryDetail on press
            >
                {/* Icon Container */}
                <View style={[styles.iconContainer, { backgroundColor: color }]}>
                    <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={styles.categoryTitle}>{source.toUpperCase()}</Text>
                    <Text>Total: ${Math.abs(total).toFixed(2)}</Text>
                    <Text>Transactions: {count}</Text>
                </View>
            </TouchableOpacity>
        );
    }}
    numColumns={calculateNumColumns()} // Dynamically calculate the number of columns
    columnWrapperStyle={styles.row} // Styling for the row wrapper
    contentContainerStyle={{ paddingHorizontal: 10 }} // Padding around the list
/>

            <TouchableOpacity style={styles.addIncomeButton} onPress={() => setIncomeSourceModalVisible(true)}>
                <Text style={styles.addIncomeButtonText}>Add Income Source</Text>
            </TouchableOpacity>

            {/* Modal for Adding or Updating Income Source */}
            <Modal visible={incomeSourceModalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add or Update Income Source</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Income Source Name"
                            value={incomeSource}
                            onChangeText={setIncomeSource}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Amount"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                        <TouchableOpacity style={styles.saveButton} onPress={handleAddOrUpdateIncomeSource}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIncomeSourceModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
        textAlign: 'center',
    },
    incomeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginVertical: 8,
        alignSelf: 'center',
        borderWidth: 1,
        borderRadius: 50,
        backgroundColor: '#fff',
        width: 'auto',
        paddingHorizontal: 15,
        marginHorizontal: 8,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        marginRight: 10,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    addIncomeButton: {
        backgroundColor: '#6200EE',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 460,
        width: '25%',
    },
    addIncomeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#6200EE',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#6200EE',
        fontSize: 16,
    },
    row: {
        justifyContent: 'space-around',
        marginHorizontal: 10,
    },
});

export default IncomePage;
