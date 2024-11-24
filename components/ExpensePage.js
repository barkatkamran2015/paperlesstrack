import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { firestore } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Normalize category names
const normalizeCategory = (category) => {
    if (!category) return 'uncategorized';
    const lowerCased = category.toLowerCase().trim();
    const mapping = {
        'home furnishings': 'furniture',
        'furnishings': 'furniture',
        'furniture': 'furniture',
        'wholesale club': 'wholesale clubs',
        'wholesale clubs': 'wholesale clubs',
        'whole sale club': 'wholesale clubs',
        'wholesale/retail': 'wholesale clubs',
        'grocery': 'Grocery',
        'groceries': 'Grocery',
        'gas': 'gas',
        'utilities': 'utilities',
        'home & garden': 'Retail',
        'home goods': 'Retail',
        'retail': 'Retail',
        'restaurants': 'restaurant',
    };
    return mapping[lowerCased] || lowerCased;
};

// Get icon for each category
const getIconForCategory = (category) => {
    switch (category) {
        case 'grocery': return 'cart';
        case 'gas': return 'gas-station';
        case 'utilities': return 'flash';
        case 'furniture': return 'chair-rolling';
        case 'wholesale clubs': return 'warehouse';
        default: return 'folder';
    }
};

// Get color for each category
const getColorForCategory = (category) => {
    switch (category) {
        case 'grocery': return '#4CAF50';
        case 'gas': return '#F44336';
        case 'utilities': return '#FFEB3B';
        case 'furniture': return '#8E44AD';
        case 'wholesale clubs': return '#2980B9';
        default: return '#2196F3';
    }
};

// Check if a category is income-based
const isIncomeCategory = (category) => {
    return ['salary', 'freelance', 'investment', 'other'].includes(category.toLowerCase());
};

const ExpensePage = ({ highlightedCategory }) => {
    const [expenses, setExpenses] = useState({});
    const [totalSpent, setTotalSpent] = useState(0);
    const { width } = useWindowDimensions();
    const numColumns = width > 600 ? 3 : 2;

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, "user_receipts"), (snapshot) => {
            const newExpenses = {};
            let totalSpent = 0;

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const normalizedCategory = normalizeCategory(data.category);

                if (!normalizedCategory || isIncomeCategory(normalizedCategory)) return;

                const amount = data.total || 0;

                if (newExpenses[normalizedCategory]) {
                    newExpenses[normalizedCategory].total += amount;
                    newExpenses[normalizedCategory].count += 1;
                } else {
                    newExpenses[normalizedCategory] = {
                        total: amount,
                        count: 1,
                        icon: getIconForCategory(normalizedCategory),
                        color: getColorForCategory(normalizedCategory),
                    };
                }
                totalSpent += Math.abs(amount);
            });

            // Explicitly remove empty categories
            Object.keys(newExpenses).forEach((category) => {
                if (!newExpenses[category] || newExpenses[category].count === 0) {
                    delete newExpenses[category];
                }
            });

            console.log('Updated Expenses:', newExpenses);
            setExpenses(newExpenses);
            setTotalSpent(totalSpent);
        });

        return () => unsubscribe();
    }, []);

    return (
        <View>
            <Text style={styles.sectionHeader}>Total Spent: ${totalSpent.toFixed(2)}</Text>
            <FlatList
                key={Object.keys(expenses).length} // Force FlatList to re-render
                data={Object.entries(expenses)}
                keyExtractor={([key]) => key}
                renderItem={({ item }) => {
                    const [category, { total, count, icon, color }] = item;
                    const isHighlighted = highlightedCategory?.toLowerCase() === category.toLowerCase();

                    return (
                        <TouchableOpacity
                            style={[
                                styles.categoryItem,
                                { borderColor: color },
                                isHighlighted && styles.highlightedCategory,
                            ]}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                                <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                                <Text>Total: ${Math.abs(total).toFixed(2)}</Text>
                                <Text>Transactions: {count}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                numColumns={numColumns}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContainer}
            />
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
    categoryItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginVertical: 8,
        borderWidth: 1,
        borderRadius: 50,
        backgroundColor: '#fff',
        maxWidth: '45%',
        marginHorizontal: '2.5%',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
    },
    highlightedCategory: {
        backgroundColor: '#f3e8ff',
        borderWidth: 2,
        borderColor: '#6200EE',
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    listContainer: {
        paddingHorizontal: 10,
    },
});

export default ExpensePage;
