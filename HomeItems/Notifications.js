import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig";

const Notifications = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const billsRef = collection(firestore, "bills");
    const budgetsRef = collection(firestore, "budgets");
    const transactionsRef = collection(firestore, "user_receipts");

    const fetchNotifications = async () => {
      try {
        const now = Date.now();
        let notificationsList = []; // Temporary storage for all notifications

        const [billSnapshot, budgetSnapshot, transactionsSnapshot] = await Promise.all([
          getDocs(billsRef),
          getDocs(budgetsRef),
          getDocs(transactionsRef),
        ]);

        // --- Fetch Bill Notifications ---
        billSnapshot.forEach((doc) => {
          const bill = doc.data();
          let dueDateMillis;

          // Normalize due date
          if (bill.dueDate?.toMillis) {
            const originalDate = bill.dueDate.toDate();
            originalDate.setHours(0, 0, 0, 0);
            dueDateMillis = originalDate.getTime();
          } else {
            dueDateMillis = new Date(`${bill.dueDate}T00:00:00Z`).getTime();
          }

          const timeDifference = dueDateMillis - now;

          if (new Date(dueDateMillis).toDateString() === new Date(now).toDateString()) {
            notificationsList.push({
              id: `bill-${doc.id}-dueToday`,
              type: "dueToday",
              title: `${bill.name} is due today!`,
              message: `Your bill of $${bill.amount} is due today.`,
            });
          }

          if (timeDifference > 0 && timeDifference <= 24 * 60 * 60 * 1000) {
            notificationsList.push({
              id: `bill-${doc.id}-dueSoon`,
              type: "dueSoon",
              title: `${bill.name} is due within 24 hours!`,
              message: `Your bill of $${bill.amount} is due tomorrow.`,
            });
          }

          if (timeDifference > 24 * 60 * 60 * 1000 && timeDifference <= 5 * 24 * 60 * 60 * 1000) {
            notificationsList.push({
              id: `bill-${doc.id}-withinFiveDays`,
              type: "withinFiveDays",
              title: `${bill.name} is due in ${Math.ceil(
                timeDifference / (24 * 60 * 60 * 1000)
              )} days!`,
              message: `Your bill of $${bill.amount} is due on ${new Date(
                dueDateMillis
              ).toLocaleString()}.`,
            });
          }
        });

        // --- Fetch Budget Notifications ---
        const expensesByCategory = {};

        // Aggregate expenses by category
        transactionsSnapshot.forEach((doc) => {
          const { category, total } = doc.data();
          if (category && typeof total === "number") {
            const normalizedCategory = category.toLowerCase().trim();
            expensesByCategory[normalizedCategory] =
              (expensesByCategory[normalizedCategory] || 0) + total;
          }
        });

        console.log("Expenses by Category:", expensesByCategory); // Debugging output

        // Compare expenses with budgets
        budgetSnapshot.forEach((doc) => {
          const budget = doc.data();
          if (!budget.amount || typeof budget.amount !== "number") {
            console.warn(`Invalid budget data: ${JSON.stringify(budget)}`);
            return;
          }

          const categoryName = budget.name.toLowerCase();
          const spent = expensesByCategory[categoryName] || 0;
          const threshold = 0.9 * budget.amount;

          if (spent >= threshold && spent < budget.amount) {
            notificationsList.push({
              id: `budget-${doc.id}-budgetWarning`,
              type: "budgetWarning",
              title: `Budget Warning: ${budget.name}`,
              message: `You have spent $${spent.toFixed(
                2
              )} of your $${budget.amount.toFixed(2)} budget for ${
                budget.name
              }.`,
            });
          }

          if (spent >= budget.amount) {
            notificationsList.push({
              id: `budget-${doc.id}-budgetExceeded`,
              type: "budgetExceeded",
              title: `Budget Exceeded: ${budget.name}`,
              message: `You have exceeded your budget for ${
                budget.name
              } by $${(spent - budget.amount).toFixed(2)}.`,
            });
          }
        });

        console.log("Notifications List:", notificationsList); // Debugging output

        // Remove duplicate notifications
        const uniqueNotifications = Array.from(
          new Map(notificationsList.map((notif) => [notif.id, notif])).values()
        );

        setNotifications(uniqueNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    const unsubscribeBills = onSnapshot(billsRef, fetchNotifications);
    const unsubscribeBudgets = onSnapshot(budgetsRef, fetchNotifications);
    const unsubscribeTransactions = onSnapshot(transactionsRef, fetchNotifications);

    return () => {
      unsubscribeBills();
      unsubscribeBudgets();
      unsubscribeTransactions();
    };
  }, []);

  const renderNotification = ({ item }) => {
    let iconName, iconColor;

    if (item.type === "dueSoon" || item.type === "dueToday") {
      iconName = "alert-circle-outline";
      iconColor = "#FF0000";
    } else if (item.type === "withinFiveDays") {
      iconName = "clock-outline";
      iconColor = "#2196F3";
    } else if (item.type === "budgetWarning") {
      iconName = "alert-circle-outline";
      iconColor = "#FFA500";
    } else if (item.type === "budgetExceeded") {
      iconName = "alert-circle-outline";
      iconColor = "#FF5722";
    }

    return (
      <View style={styles.notificationCard}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={iconColor}
            style={{ marginRight: 8 }}
          />
          <View>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text>{item.message}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("SetBudget")}
        >
          <Text style={styles.buttonText}>Set Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("SetBills")}
        >
          <Text style={styles.buttonText}>Set Bills</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>No notifications available.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: "#673AB7",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  notificationCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#673AB7",
  },
  notificationTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  emptyMessage: { textAlign: "center", fontSize: 14, color: "#6c757d" },
});

export default Notifications;
