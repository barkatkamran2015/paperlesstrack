import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { firestore } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

const FinancialHighlights = () => {
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0); // New state for total income
    const [netSavings, setNetSavings] = useState(0);

    useEffect(() => {
        // Fetch total expenses
        const unsubscribeExpenses = onSnapshot(
            collection(firestore, 'user_receipts'),
            (snapshot) => {
                if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
                    let expenses = 0;

                    snapshot.docs.forEach((doc) => {
                        const data = doc.data();
                        if (data && data.total) {
                            expenses += parseFloat(data.total) || 0; // Safely add total values
                        }
                    });

                    setTotalExpenses(expenses);
                    console.log('Updated Total Expenses:', expenses);
                } else {
                    console.warn('No receipts found.');
                    setTotalExpenses(0); // Reset to 0 if no receipts exist
                }
            },
            (error) => {
                console.error('Error fetching user receipts:', error);
            }
        );

        // Fetch total income
        const unsubscribeIncome = onSnapshot(
            collection(firestore, 'incomes'),
            (snapshot) => {
                if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
                    let income = 0;

                    snapshot.docs.forEach((doc) => {
                        const data = doc.data();
                        if (data && data.total) {
                            income += parseFloat(data.total) || 0; // Safely add total values
                        }
                    });

                    setTotalIncome(income);
                    console.log('Updated Total Income:', income);
                } else {
                    console.warn('No incomes found.');
                    setTotalIncome(0); // Reset to 0 if no incomes exist
                }
            },
            (error) => {
                console.error('Error fetching incomes:', error);
            }
        );

        return () => {
            unsubscribeExpenses();
            unsubscribeIncome();
        };
    }, []);

    // Update net savings whenever total expenses or total income changes
    useEffect(() => {
        setNetSavings(totalIncome - totalExpenses);
        console.log('Updated Net Savings:', totalIncome - totalExpenses);
    }, [totalExpenses, totalIncome]);

    return (
        <View style={styles.container}>
            {/* Total Expenses */}
            <LinearGradient
                colors={['#FF512F', '#DD2476']}
                style={styles.card}
            >
                <Text style={styles.label}>Total Expenses</Text>
                <Text style={styles.value}>${totalExpenses.toFixed(2)}</Text>
            </LinearGradient>

            {/* Net Savings */}
            <LinearGradient
                colors={['#7F00FF', '#E100FF']}
                style={styles.card}
            >
                <Text style={styles.label}>Net Savings</Text>
                <Text style={[styles.value, netSavings >= 0 ? styles.positive : styles.negative]}>
                    ${netSavings.toFixed(2)}
                </Text>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    card: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 6,
        padding: 16,
        borderRadius: 12,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 6,
        fontWeight: '600',
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    positive: {
        color: '#FFFFFF',
    },
    negative: {
        color: '#FF4F4F',
    },
});

export default FinancialHighlights;
