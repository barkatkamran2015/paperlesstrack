import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Ensure this is imported correctly

const ReceiptList = ({ navigation }) => {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch receipts from Firestore when the component is mounted
    useEffect(() => {
        const fetchReceipts = async () => {
            try {
                const querySnapshot = await getDocs(collection(firestore, 'user_receipts'));
                const fetchedReceipts = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
    
                // Deduplication logic
                const deduplicatedReceipts = fetchedReceipts.reduce((unique, current) => {
                    const isDuplicate = unique.some(
                        (receipt) =>
                            receipt.vendor === current.vendor &&
                            receipt.date === current.date &&
                            receipt.total === current.total
                    );
    
                    if (!isDuplicate) {
                        unique.push(current);
                    }
    
                    return unique;
                }, []);
    
                console.log('Deduplicated Receipts:', deduplicatedReceipts); // Debug log
    
                setReceipts(deduplicatedReceipts);
            } catch (error) {
                console.error('Error fetching receipts from Firestore:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchReceipts();
    }, []);
    

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('ReceiptDetail', { receiptData: item })}>
            <View style={styles.receiptItem}>
                {/* Use fallback values if any field is missing */}
                <Text style={styles.vendor}>{item.vendor || 'Unknown Vendor'}</Text>
                <Text style={styles.date}>{item.date || 'Date: N/A'}</Text>
                <Text style={styles.amount}>{item.total !== undefined ? `$${item.total.toFixed(2)}` : 'Total: N/A'}</Text>
                <Text style={styles.category}>{item.category || 'Category: Unspecified'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#6200EE" />
            ) : receipts.length > 0 ? (
                <FlatList
                    data={receipts}
                    keyExtractor={(item) => item.id} // Use the Firestore document ID as the key
                    renderItem={renderItem}
                />
            ) : (
                <Text style={styles.noReceiptsText}>No receipts available</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f7f7f7',
    },
    receiptItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    vendor: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    date: {
        color: '#666',
    },
    amount: {
        color: '#000',
        fontWeight: '600',
    },
    category: {
        color: '#999',
        fontStyle: 'italic',
    },
    noReceiptsText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
});

export default ReceiptList;
