import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { firestore } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

const GraphPage = () => {
    const [totalEarned, setTotalEarned] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const targetAmount = 10500;  // Set a target amount for both Earned and Spent goals

    useEffect(() => {
        // Fetch and sum total expenses from the "user_receipts" collection
        const unsubscribeExpenses = onSnapshot(collection(firestore, "user_receipts"), (snapshot) => {
            console.log("GraphPage - onSnapshot for expenses triggered."); // Check if listener triggers
            let spent = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                console.log("GraphPage - Processing expense document:", data); // Log each document

                // Sum all `total` values directly since there is no "type" field to filter by expense
                spent += Math.abs(data.total || 0);
            });

            console.log("GraphPage - Calculated total spent:", spent); // Log the final calculated spent value
            setTotalSpent(spent);
        });

        // Fetch and sum total incomes from the "incomes" collection
        const unsubscribeIncomes = onSnapshot(collection(firestore, "incomes"), (snapshot) => {
            let earned = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                earned += data.total || 0;
            });
            setTotalEarned(earned);
        });

        return () => {
            unsubscribeExpenses();
            unsubscribeIncomes();
        };
    }, []);

    const earnedProgress = Math.min(totalEarned / targetAmount, 1);
    const spentProgress = Math.min(totalSpent / targetAmount, 1);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Monthly Savings</Text>

            {/* Earned Progress Bar */}
            <View style={styles.progressContainer}>
                <Text style={styles.label}>Earned</Text>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${earnedProgress * 100}%`, backgroundColor: '#2bbef9' }]} />
                    <Text style={styles.progressText}>${totalEarned.toFixed(2)} / ${targetAmount.toFixed(2)}</Text>
                </View>
            </View>

            {/* Spent Progress Bar */}
            <View style={styles.progressContainer}>
                <Text style={styles.label}>Spent</Text>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${spentProgress * 100}%`, backgroundColor: '#EF5350' }]} />
                    <Text style={styles.progressText}>${totalSpent.toFixed(2)} / ${targetAmount.toFixed(2)}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        alignItems: 'stretch',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    progressContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    progressBarBackground: {
        height: 20,
        borderRadius: 10,
        backgroundColor: '#E0E0E0',
        overflow: 'hidden',
        justifyContent: 'center',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 10,
    },
    progressText: {
        position: 'absolute',
        alignSelf: 'center',
        color: '#333',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default GraphPage;
