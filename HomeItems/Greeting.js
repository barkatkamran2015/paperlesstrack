import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const getGreetingMessage = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const Greeting = ({ userName }) => {
    const [netSavings, setNetSavings] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set up real-time listeners for receipts and incomes
        const receiptCollectionRef = collection(firestore, 'user_receipts');
        const incomeCollectionRef = collection(firestore, 'incomes');

        // Real-time listener for receipts
        const unsubscribeReceipts = onSnapshot(receiptCollectionRef, (snapshot) => {
            const receipts = snapshot.docs.map((doc) => doc.data());
            const expenses = calculateTotalExpenses(receipts);
            setTotalExpenses(expenses);
        });

        // Real-time listener for incomes
        const unsubscribeIncomes = onSnapshot(incomeCollectionRef, (snapshot) => {
            const incomes = snapshot.docs.map((doc) => doc.data());
            const income = calculateTotalIncome(incomes);
            setTotalIncome(income);
        });

        setLoading(false); // Stop the loading indicator once listeners are set up

        // Cleanup function to unsubscribe from listeners
        return () => {
            unsubscribeReceipts();
            unsubscribeIncomes();
        };
    }, []);

    useEffect(() => {
        // Calculate net savings whenever totalExpenses or totalIncome changes
        setNetSavings(totalIncome - totalExpenses);
    }, [totalExpenses, totalIncome]);

    const calculateTotalExpenses = (receiptList = []) => {
        let totalExpenses = 0;
        if (Array.isArray(receiptList)) {
            receiptList.forEach((receipt) => {
                const { type = 'expense', total = 0 } = receipt || {};
                if (type === 'expense') {
                    totalExpenses += total;
                }
            });
        }
        return totalExpenses;
    };

    const calculateTotalIncome = (incomeList = []) => {
        let totalIncome = 0;
        if (Array.isArray(incomeList)) {
            incomeList.forEach((income) => {
                const { total = 0 } = income || {};
                totalIncome += total;
            });
        }
        return totalIncome;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    const isPositive = netSavings >= 0;
    const savingsMessage = isPositive
        ? `You're on track to save $${netSavings.toFixed(2)} this month. Keep it up!`
        : `You've overspent by $${Math.abs(netSavings).toFixed(2)} this month. Consider reviewing your budget.`;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {getGreetingMessage()}, {userName || 'User'}!
            </Text>
            <Text
                style={[
                    styles.subtitle,
                    isPositive ? styles.savingsPositive : styles.savingsNegative,
                ]}
            >
                {savingsMessage}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    savingsPositive: {
        color: '#4CAF50', // Green for positive savings
    },
    savingsNegative: {
        color: '#F44336', // Red for overspending
    },
});

export default Greeting;
