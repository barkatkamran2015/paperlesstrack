import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { firestore } from '../firebaseConfig'; // Ensure Firebase is configured correctly
import { collection, onSnapshot } from 'firebase/firestore';

const RecentTransactions = () => {
    const [recentTransactions, setRecentTransactions] = useState([]);

    useEffect(() => {
        // Real-time listener for user_receipts collection
        const unsubscribe = onSnapshot(collection(firestore, "user_receipts"), (snapshot) => {
            const now = new Date();
            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            const seenReceipts = new Set(); // Use a Set to track duplicates

            const updatedTransactions = [];
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const receiptIdentifier = `${data.vendor}-${data.total}-${data.date}`; // Unique key for a receipt

                if (seenReceipts.has(receiptIdentifier)) {
                    // Duplicate detected
                    Alert.alert("Duplicate Receipt", "This receipt has already been scanned.");
                } else {
                    // Add unique receipt to the list
                    seenReceipts.add(receiptIdentifier);
                    const transactionDate = new Date(data.date);

                    // Filter transactions within the last 7 days
                    if (now - transactionDate <= SEVEN_DAYS) {
                        updatedTransactions.push({
                            id: doc.id,
                            vendor: data.vendor?.trim(),
                            category: data.category?.trim(),
                            total: data.total || 0,
                            date: transactionDate,
                        });
                    }
                }
            });

            setRecentTransactions(updatedTransactions);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

    const getIconAndColor = (categoryOrVendor) => {
        const vendorMapping = {
            ikea: { icon: 'sofa', color: '#8BC34A' }, // Furniture - Green
            walmart: { icon: 'store', color: '#FF5722' }, // General Store - Orange
            costco: { icon: 'warehouse', color: '#FF9800' }, // Wholesale - Yellow
            'real canadian superstore': { icon: 'cart-outline', color: '#4CAF50' }, // Grocery - Green
            homesense: { icon: 'hanger', color: '#6A1B9A' }, // Home Goods - Purple
            winners: { icon: 'hanger', color: '#6A1B9A' }, // Home Goods - Purple
            'boston pizza': { icon: 'silverware-fork-knife', color: '#FF5722' }, // Restaurant - Red
            'pizza hut': { icon: 'pizza', color: '#FF9800' }, // Pizza - Orange
            starbucks: { icon: 'coffee', color: '#4CAF50' }, // Coffee - Green
            'tim hortons': { icon: 'coffee-outline', color: '#FF7043' }, // Coffee - Brown
            amazon: { icon: 'amazon', color: '#FF9900' }, // E-commerce - Orange
            ebay: { icon: 'shopping', color: '#0066FF' }, // E-commerce - Blue
            apple: { icon: 'apple', color: '#000000' }, // Technology - Black
            samsung: { icon: 'cellphone', color: '#1E88E5' }, // Electronics - Blue
            netflix: { icon: 'netflix', color: '#E50914' }, // Streaming - Red
            disney: { icon: 'filmstrip', color: '#0066FF' }, // Entertainment - Blue
            'best buy': { icon: 'television', color: '#FFC107' }, // Electronics - Yellow
            target: { icon: 'bullseye-arrow', color: '#D32F2F' }, // General Store - Red
        };
    
        const categoryMapping = {
            Grocery: { icon: 'cart-outline', color: '#FF5722' },
            Gas: { icon: 'fuel', color: '#FF9800' },
            Food: { icon: 'food-fork-drink', color: '#4CAF50' },
            Restaurants: { icon: 'silverware-fork-knife', color: '#FF5722' },
            Electronics: { icon: 'cellphone', color: '#1E88E5' },
            Entertainment: { icon: 'filmstrip', color: '#8BC34A' },
            Clothing: { icon: 'tshirt-crew', color: '#F06292' },
            Home: { icon: 'home-outline', color: '#6A1B9A' },
            Transport: { icon: 'car', color: '#2196F3' },
            Utilities: { icon: 'flash', color: '#FFC107' },
            Uncategorized: { icon: 'help-circle', color: '#9E9E9E' }, // Fallback
        };
    
        const normalizedVendor = (categoryOrVendor || '').toLowerCase().trim();
        if (vendorMapping[normalizedVendor]) {
            return vendorMapping[normalizedVendor];
        }
    
        return categoryMapping[categoryOrVendor] || categoryMapping['Uncategorized'];
    };
    

    const renderTransactionItem = ({ item }) => {
        const { icon, color } = getIconAndColor(item.vendor || item.category);
    
        return (
            <View style={styles.transactionItem}>
                <View style={[styles.iconContainer, { backgroundColor: color }]}>
                    <MaterialCommunityIcons
                        name={icon}
                        size={24}
                        color="#FFF" // White icon for contrast
                    />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.vendor}>{item.vendor || 'Unknown Vendor'}</Text>
                    <Text style={styles.details}>
                        <Text style={styles.amount}>${item.total.toFixed(2)}</Text>
                        {'  |  '}
                        <Text style={styles.date}>{item.date.toISOString().split('T')[0]}</Text>
                    </Text>
                </View>
            </View>
        );
    };    

    return (
        <FlatList
            data={recentTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            horizontal={false}
            numColumns={2}
            contentContainerStyle={styles.container}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        margin: 8,
        flex: 1,
        maxWidth: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    transactionDetails: {
        flex: 1,
    },
    vendor: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    details: {
        fontSize: 12,
        color: '#757575',
    },
    amount: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    date: {
        fontStyle: 'italic',
        color: '#BDBDBD',
    },
});

export default RecentTransactions;
