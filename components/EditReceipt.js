import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { firestore } from '../firebaseConfig'; // Ensure Firestore is properly configured
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const EditReceipt = ({ navigation, route }) => {
    const { receipt } = route.params;

    const categories = ['Grocery', 'Entertainment', 'Utilities']; // Example from CategoryPage

    // Set initial states from the receipt data
    const [vendor, setVendor] = useState(receipt?.vendor || '');
    const [total, setTotal] = useState(receipt?.total ? receipt.total.toString() : '');
    const [category, setCategory] = useState(receipt?.category || '');
    const [isSaving, setIsSaving] = useState(false);

    // Helper function to fetch Firestore document ID dynamically
    const fetchDocId = async (receiptId) => {
        try {
            const q = query(
                collection(firestore, 'user_receipts'),
                where('id', '==', receiptId) // Match the `id` field in Firestore
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error('No matching document found.');
                throw new Error('No matching receipt found in Firestore.');
            }

            const docId = querySnapshot.docs[0].id;
            console.log('Document ID found:', docId);
            return docId;
        } catch (error) {
            console.error('Error fetching document ID:', error.message);
            throw error;
        }
    };

    const handleSave = async () => {
        if (!receipt.docId) {
            Alert.alert('Error', 'Missing Document ID. Unable to save changes.');
            return;
        }
    
        setIsSaving(true);
        try {
            const receiptRef = doc(firestore, 'user_receipts', receipt.docId);
            await updateDoc(receiptRef, {
                vendor: vendor.trim(),
                total: parseFloat(total),
                category: category.trim(),
            });
    
            Alert.alert('Success', 'Receipt updated successfully.');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving receipt:', error.message);
            Alert.alert('Error', error.message || 'Failed to save receipt. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };     

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Edit Receipt</Text>
            <TextInput
                style={styles.input}
                placeholder="Vendor"
                value={vendor}
                onChangeText={setVendor}
                editable={!isSaving}
            />
            <TextInput
                style={styles.input}
                placeholder="Total"
                value={total}
                onChangeText={setTotal}
                keyboardType="numeric"
                editable={!isSaving}
            />
            <TextInput
                style={styles.input}
                placeholder="Category"
                value={category}
                onChangeText={setCategory}
                editable={!isSaving}
            />
            <Button
                title={isSaving ? 'Saving...' : 'Save'}
                onPress={handleSave}
                disabled={isSaving}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f7f7f7',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
});

export default EditReceipt;
