import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart as RNBarChart } from "react-native-chart-kit";
import { firestore } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;

const BarChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [], colors: [] }],
  });

  // Define solid colors for each category
  const categoryColors = {
    Grocery: "#ef42f5",// Red
    Furniture: "#36A2EB", // Blue
    'Wholesale Clubs': "#FFCE56", // Yellow
    'gas station': "#4BC0C0", // Teal
    restaurant: '#b7eb34',
    Utilities: "#9966FF", // Purple
    Retail: "#FFA600", // Orange
    Uncategorized: "#BDBDBD", // Gray
  };

  const normalizeCategory = (category) => {
    if (!category) return "Uncategorized";
    const lowerCased = category.toLowerCase().trim();
    const mapping = {
      "home furnishings": "Furniture",
      furnishings: "Furniture",
      furniture: "Furniture",
      "wholesale club": "Wholesale Clubs",
      "Wholesale Clubs": "Wholesale Clubs",
      "whole sale club": "Wholesale Clubs",
      "wholesale/retail": "Wholesale Clubs",
      'grocery': "Grocery",
      'groceries': "Grocery",
      'gas': "Gas",
      'gas': 'gas station',
      utilities: "Utilities",
      retail: "Retail",
      "home & garden": "Retail",
      "home goods": "Retail",
      'restaurants': 'restaurant'
    };
    return mapping[lowerCased] || lowerCased;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "user_receipts"), (snapshot) => {
      const categoryTotals = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const category = normalizeCategory(data.category);
        const amount = parseFloat(data.total || 0);

        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });

      const labels = Object.keys(categoryTotals);
      const data = Object.values(categoryTotals);

      // Map colors directly as solid values
      const colors = labels.map((label) => categoryColors[label] || categoryColors.Uncategorized);

      setChartData({
        labels,
        datasets: [
          {
            data,
            colors: colors.map((color) => () => color), // Return a function that provides a solid color
          },
        ],
      });
    });

    return () => unsubscribe();
  }, []);

  const chartConfig = {
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.7,
    propsForVerticalLabels: {
      fontSize: 12,
      fontWeight: "bold",
    },
    propsForHorizontalLabels: {
      fontSize: 12,
      fontWeight: "bold",
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spending by Category</Text>
      <RNBarChart
        data={{
          labels: chartData.labels,
          datasets: [
            {
              data: chartData.datasets[0].data,
              colors: chartData.datasets[0].colors, // Use solid colors
            },
          ],
        }}
        width={screenWidth - 32}
        height={280}
        yAxisLabel="$"
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
        withCustomBarColorFromData // Ensure each bar uses the provided colors
        showBarTops={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#4A148C",
    textAlign: "center",
  },
  chart: {
    borderRadius: 10,
  },
});

export default BarChart;
