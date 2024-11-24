import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { firestore } from "../firebaseConfig";

const SetBills = ({ navigation }) => {
  const [billName, setBillName] = useState("");
  const [amount, setAmount] = useState("");
  const [budget, setBudget] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSaveBill = async () => {
    if (!billName || !amount || !budget || !dueDate) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // Validate and parse the date string
    const dueDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dueDateRegex.test(dueDate.trim())) {
      Alert.alert("Error", "Due Date must be in the format YYYY-MM-DD.");
      return;
    }

    // Convert to Firestore Timestamp
    const dueDateTimestamp = Timestamp.fromDate(new Date(`${dueDate.trim()}T00:00:00Z`));

    try {
      const billsRef = collection(firestore, "bills");
      await addDoc(billsRef, {
        name: billName,
        amount: parseFloat(amount),
        budget: parseFloat(budget),
        dueDate: dueDateTimestamp,
      });

      setBillName("");
      setAmount("");
      setBudget("");
      setDueDate("");

      Alert.alert("Success", "Bill saved successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving bill:", error.message);
      Alert.alert("Error", "Could not save the bill. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Set a New Bill</Text>
      <TextInput
        style={styles.input}
        placeholder="Bill Name"
        value={billName}
        onChangeText={setBillName}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Budget"
        keyboardType="numeric"
        value={budget}
        onChangeText={setBudget}
      />
      <TextInput
        style={styles.input}
        placeholder="Due Date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
      />
      <TouchableOpacity style={styles.button} onPress={handleSaveBill}>
        <Text style={styles.buttonText}>Save Bill</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 16, borderRadius: 4 },
  button: { backgroundColor: "#673AB7", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default SetBills;
