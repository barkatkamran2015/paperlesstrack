import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ExpensePage from './ExpensePage';
import IncomePage from './IncomePage';
import GraphPage from './GraphPage';

const CategoryPage = () => {
    // State to toggle between Expense and Income
    const [isExpense, setIsExpense] = useState(true);

    // Access the route parameters
    const route = useRoute();
    const { selectedCategory } = route.params || {}; // Extract selectedCategory from params

    return (
        <View style={styles.container}>
            {/* Header Image */}
            <Image source={require('../assets/categorywave.png')} style={styles.headerImage} />

            {/* Graph always displayed at the top */}
            <GraphPage />

            {/* Toggle Header and Switch */}
            <View style={styles.header}>
                <Text style={styles.headerText}>{isExpense ? 'Expenses' : 'Income'}</Text>
                <Switch
                    value={isExpense}
                    onValueChange={() => setIsExpense(!isExpense)}
                    thumbColor="#6200EE"
                    trackColor={{ true: '#BB86FC', false: '#03DAC6' }}
                    style={styles.toggleSwitch}
                />
            </View>

            {/* Conditionally render either ExpensePage or IncomePage */}
            <View style={styles.pageContent}>
                {isExpense ? (
                    <ExpensePage highlightedCategory={selectedCategory} /> // Pass selectedCategory to ExpensePage
                ) : (
                    <IncomePage />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0, // Remove padding around the container
        backgroundColor: '#f9f9f9',
    },
    headerImage: {
        width: '100%',
        height: 200, // Adjust height as needed
        resizeMode: 'cover', // Ensure the image covers the width without stretching
        marginBottom: 20, // Space below the header image
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 20, // Add some padding for the content within the header
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    toggleSwitch: {
        alignSelf: 'flex-start',
    },
    pageContent: {
        flex: 1,
        marginTop: 10,
    },
});

export default CategoryPage;
