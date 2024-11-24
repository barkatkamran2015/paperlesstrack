import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import CalendarPicker from './CalendarPicker'; // Import CalendarPicker

const screenWidth = Dimensions.get('window').width;

const colors = [
    '#FF6384', // Soft red
    '#36A2EB', // Light blue
    '#FFCE56', // Vibrant yellow
    '#4BC0C0', // Soft teal
    '#9966FF', // Purple
    '#FF9F40', // Orange
    '#00A651', // Bright green
];

const DEBUG = false; // Set to true for debugging logs

const GraphScreen = () => {
    const [receipts, setReceipts] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [netSavings, setNetSavings] = useState(0);
    const [topSpendingCategory, setTopSpendingCategory] = useState('');
    const [selectedStartDate, setSelectedStartDate] = useState(null); // Start date from CalendarPicker
    const [selectedEndDate, setSelectedEndDate] = useState(null); // End date from CalendarPicker

    // Fetch data on mount
    useEffect(() => {
        const receiptUnsubscribe = onSnapshot(
            collection(firestore, 'user_receipts'),
            (snapshot) => {
                const fetchedReceipts = snapshot.docs.map((doc) => doc.data());
                setReceipts(fetchedReceipts);
                if (DEBUG) console.log('Fetched Receipts:', fetchedReceipts);
            },
            (error) => {
                console.error('Error fetching receipts:', error);
            }
        );

        const incomeUnsubscribe = onSnapshot(
            collection(firestore, 'incomes'),
            (snapshot) => {
                const fetchedIncomes = snapshot.docs.map((doc) => doc.data());
                setIncomes(fetchedIncomes);
                if (DEBUG) console.log('Fetched Incomes:', fetchedIncomes);
            },
            (error) => {
                console.error('Error fetching incomes:', error);
            }
        );

        return () => {
            receiptUnsubscribe();
            incomeUnsubscribe();
        };
    }, []);

    useEffect(() => {
        if (receipts && incomes) {
            setLoading(true);
            calculateChartData(receipts, incomes);
            setLoading(false);
        }
    }, [receipts, incomes, selectedStartDate, selectedEndDate]);

    const calculateChartData = (receiptList, incomeList) => {
        const categoryMap = {};
        let expenses = 0;
        let income = 0;
        let topCategory = { name: '', total: 0 };

        // Helper function to normalize categories
        const normalizeCategory = (category) => {
            if (!category) return 'Uncategorized';
            const lowerCased = category.toLowerCase().trim();
            const mapping = {
                'home furnishings': 'Furniture',
                'furnishings': 'Furniture',
                'furniture': 'Furniture',
                'wholesale club': 'Wholesale Clubs',
                'whole sale club': 'Wholesale Clubs',
                'wholesale/retail': 'Wholesale Clubs',
                'grocery': 'Grocery',
                'groceries': 'Grocery',
                'gas': 'Gas',
                'utilities': 'Utilities',
                'retail': 'Retail',
                'home & garden': 'Retail',
                'home goods': 'Retail',
                'restaurants': 'restaurant',
            };
            return mapping[lowerCased] || lowerCased;
        };

        // Filter receipts based on the selected date range
        const filteredReceipts = receiptList.filter((receipt) => {
            const receiptDate = new Date(receipt.date);
            return (
                (!selectedStartDate || receiptDate >= new Date(selectedStartDate)) &&
                (!selectedEndDate || receiptDate <= new Date(selectedEndDate))
            );
        });

        const filteredIncomes = incomeList.filter((incomeDoc) => {
            const incomeDate = incomeDoc.date ? new Date(incomeDoc.date) : null;
            return (
                !incomeDate || // Include incomes with no date field
                ((!selectedStartDate || incomeDate >= new Date(selectedStartDate)) &&
                    (!selectedEndDate || incomeDate <= new Date(selectedEndDate)))
            );
        });

        if (!filteredReceipts.length && !filteredIncomes.length) {
            setChartData([]);
            setTotalExpenses(0);
            setTotalIncome(0);
            setNetSavings(0);
            setTopSpendingCategory('');
            return;
        }

        // Calculate expenses and transactions per category
        filteredReceipts.forEach((receipt) => {
            const { type = 'expense', category = 'Unknown', total = 0 } = receipt;
            const normalizedCategory = normalizeCategory(category);

            if (type === 'expense') {
                expenses += total;

                if (!categoryMap[normalizedCategory]) {
                    categoryMap[normalizedCategory] = { total: 0, transactions: 0 };
                }
                categoryMap[normalizedCategory].total += total;
                categoryMap[normalizedCategory].transactions += 1;
            }
        });

        // Calculate total income
        filteredIncomes.forEach((incomeDoc) => {
            const { total = 0 } = incomeDoc; // Default to 0 if total is missing
            income += isNaN(total) ? 0 : total; // Ensure total is numeric
        });

        // Determine the top spending category
        Object.entries(categoryMap).forEach(([category, data]) => {
            if (data.total > topCategory.total) {
                topCategory = { name: category, total: data.total };
            }
        });

        // Prepare chart data
        const chartDataArray = Object.entries(categoryMap).map(([category, data], index) => ({
            name: category,
            total: data.total,
            transactions: data.transactions,
            percentage: expenses > 0 ? ((data.total / expenses) * 100).toFixed(2) : 0,
            color: colors[index % colors.length],
        }));

        // Update states
        setTotalExpenses(expenses);
        setTotalIncome(income);
        setNetSavings(income - expenses);
        setTopSpendingCategory(topCategory.name);
        setChartData(chartDataArray);

        if (DEBUG) {
            console.log('Filtered Receipts:', filteredReceipts);
            console.log('Filtered Incomes:', filteredIncomes);
            console.log('Category Map:', categoryMap);
            console.log('Chart Data:', chartDataArray);
            console.log('Income:', income, 'Expenses:', expenses, 'Net Savings:', income - expenses);
            console.log('Top Spending Category:', topCategory.name);
        }
    };

    const getCategoryIcon = (category) => {
        const normalizedCategory = category.trim().toLowerCase();
        switch (normalizedCategory) {
            case 'wholesale club':
            case 'wholesale clubs':
                return 'cart'; // Wholesale Clubs
            case 'grocery':
                return 'cart-outline'; // Grocery
            case 'gas':
            case 'gas station':
                return 'gas-station'; // Gas Station
            case 'retail':
                return 'store'; // Retail
            case 'restaurant':
            case 'dining':
            case 'food':
                return 'silverware'; // Restaurant / Dining
            case 'coffee shop':
            case 'cafe':
                return 'coffee'; // Coffee Shop or Cafe
            case 'furniture':
                return 'chair-rolling'; // Furniture
            case 'transport':
            case 'car rental':
            case 'travel':
                return 'car'; // Transport or Travel
            case 'fast food':
                return 'hamburger'; // Fast Food
            case 'pizza':
                return 'pizza'; // Pizza Shops
            case 'dessert':
            case 'bakery':
                return 'cake'; // Bakeries or Dessert Shops
            case 'electronics':
                return 'laptop'; // Electronics Stores
            case 'clothing':
            case 'apparel':
                return 'tshirt-crew'; // Clothing Stores
            case 'beauty':
            case 'salon':
                return 'lipstick'; // Beauty or Salon
            case 'pharmacy':
            case 'medical':
                return 'pill'; // Pharmacies or Medical Stores
            case 'entertainment':
            case 'movies':
                return 'movie-open'; // Entertainment
            default:
                return 'help-circle'; // Default for Uncategorized
        }        
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CalendarPicker
                onDateRangeChange={(startDate, endDate) => {
                    setSelectedStartDate(startDate);
                    setSelectedEndDate(endDate);
                    if (DEBUG) console.log('Selected Date Range:', { startDate, endDate });
                }}
            />
            <View style={styles.overviewContainer}>
                <View style={[styles.metricCard, { backgroundColor: '#FF7F50' }]}>
                    <Text style={styles.metricLabel}>Total Expenses</Text>
                    <Text style={styles.metricValue}>${totalExpenses.toFixed(2)}</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: '#1E90FF' }]}>
                    <Text style={styles.metricLabel}>Total Income</Text>
                    <Text style={styles.metricValue}>${totalIncome.toFixed(2)}</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: '#c433f5' }]}>
                    <Text style={styles.metricLabel}>Net Savings</Text>
                    <Text
                        style={[
                            styles.metricValue,
                            netSavings >= 0 ? styles.savingsPositive : styles.savingsNegative,
                        ]}
                    >
                        ${netSavings.toFixed(2)}
                    </Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: '#FFD700' }]}>
                    <Text style={styles.metricLabel}>Top Spending Category</Text>
                    <Text style={styles.metricValue}>
                        {topSpendingCategory || 'No Expenses'}
                    </Text>
                </View>
            </View>
            {chartData.length > 0 && (
                <PieChart
                    data={chartData}
                    width={screenWidth - 32}
                    height={220}
                    accessor="total"
                    backgroundColor="transparent"
                    paddingLeft="20"
                    chartConfig={{
                        backgroundColor: '#FFF',
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                />
            )}
            <FlatList
                key={'TWO_COLUMN_LAYOUT'}
                data={chartData}
                keyExtractor={(item) => item.name}
                numColumns={2}
                renderItem={({ item }) => (
                    <View style={styles.gridItem}>
                        <View
                            style={[styles.iconContainer, { backgroundColor: item.color }]}
                        >
                            <MaterialCommunityIcons
                                name={getCategoryIcon(item.name)}
                                size={28}
                                color="#FFF"
                            />
                        </View>
                        <Text style={styles.categoryText}>{item.name}</Text>
                        <Text style={styles.transactionText}>
                            {item.transactions} {item.transactions === 1 ? 'transaction' : 'transactions'}
                        </Text>
                        <Text style={styles.amountText}>${item.total.toFixed(2)}</Text>
                    </View>
                )}
                contentContainerStyle={styles.gridContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    overviewContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, marginTop: 20 },
    metricCard: { width: '48%', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
    metricLabel: { fontSize: 14, color: '#FFF', marginBottom: 8 },
    metricValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    savingsPositive: { color: '#32CD32' },
    savingsNegative: { color: '#FF5252' },
    gridContainer: { paddingHorizontal: 16, paddingTop: 16 },
    gridItem: { flex: 1, alignItems: 'center', margin: 8, backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    categoryText: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' },
    transactionText: { fontSize: 12, color: '#888', marginTop: 2, textAlign: 'center' },
    amountText: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 2 },
});

export default GraphScreen;
