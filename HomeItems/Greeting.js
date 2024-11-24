import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const getGreetingMessage = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const Greeting = ({ userName }) => {
    const [netSavings, setNetSavings] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const receiptCollectionRef = collection(firestore, 'user_receipts');
                const incomeCollectionRef = collection(firestore, 'incomes');

                const [receiptsSnapshot, incomesSnapshot] = await Promise.all([
                    getDocs(receiptCollectionRef),
                    getDocs(incomeCollectionRef),
                ]);

                const receipts = receiptsSnapshot.docs.map((doc) => doc.data());
                const incomes = incomesSnapshot.docs.map((doc) => doc.data());

                calculateNetSavings(receipts, incomes);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const calculateNetSavings = (receiptList, incomeList) => {
        let totalExpenses = 0;
        let totalIncome = 0;

        receiptList.forEach((receipt) => {
            const { type = 'expense', total = 0 } = receipt;
            if (type === 'expense') {
                totalExpenses += total;
            }
        });

        incomeList.forEach((income) => {
            const { total = 0 } = income;
            totalIncome += total;
        });

        setNetSavings(totalIncome - totalExpenses);
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
