import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
} from "react-native";
import { firestore } from "../firebaseConfig";
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const SetBudget = () => {
    const [budgets, setBudgets] = useState([]); // List of budgets
    const [newBudgetName, setNewBudgetName] = useState(''); // Input: Budget name
    const [newBudgetAmount, setNewBudgetAmount] = useState(''); // Input: Budget amount
    const [editingBudgetId, setEditingBudgetId] = useState(null); // For tracking editing state

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.error("No user is logged in.");
            return;
        }

        const budgetsQuery = query(
            collection(firestore, "budgets"),
            where("userId", "==", user.uid) // Scope budgets to the logged-in user
        );

        const unsubscribe = onSnapshot(budgetsQuery, (snapshot) => {
            const budgetList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            console.log("Fetched budgets:", budgetList);
            setBudgets(budgetList);
        });

        return () => unsubscribe();
    }, []);

    const handleAddBudget = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            Alert.alert("Error", "You must be logged in to add a budget.");
            return;
        }

        if (!newBudgetName.trim() || !newBudgetAmount.trim()) {
            Alert.alert("Validation Error", "Please provide both budget name and amount.");
            return;
        }

        if (budgets.some((budget) => budget.name.toLowerCase() === newBudgetName.toLowerCase())) {
            Alert.alert("Duplicate Budget", "A budget with this name already exists.");
            return;
        }

        try {
            const amount = parseFloat(newBudgetAmount);
            if (isNaN(amount) || amount <= 0) {
                Alert.alert("Validation Error", "Please enter a valid positive amount.");
                return;
            }

            await addDoc(collection(firestore, "budgets"), {
                name: newBudgetName.trim(),
                amount: amount,
                userId: user.uid, // Attach the logged-in user's ID
            });

            setNewBudgetName(""); // Clear input fields
            setNewBudgetAmount("");
            Alert.alert("Success", "Budget added successfully!");
        } catch (error) {
            console.error("Error adding budget:", error);
            Alert.alert("Error", "Failed to add budget. Please try again.");
        }
    };

    const handleUpdateBudget = async (budgetId, updatedAmount) => {
        try {
            const amount = parseFloat(updatedAmount);
            if (isNaN(amount) || amount <= 0) {
                Alert.alert("Validation Error", "Please enter a valid positive amount.");
                return;
            }

            const budgetDoc = doc(firestore, "budgets", budgetId);
            await updateDoc(budgetDoc, { amount: amount });
            setEditingBudgetId(null); // Exit editing mode
            Alert.alert("Success", "Budget updated successfully!");
        } catch (error) {
            console.error("Error updating budget:", error);
            Alert.alert("Error", "Failed to update budget. Please try again.");
        }
    };

    const handleDeleteBudget = async (budgetId) => {
        Alert.alert("Delete Confirmation", "Are you sure you want to delete this budget?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const budgetDoc = doc(firestore, "budgets", budgetId);
                        await deleteDoc(budgetDoc);
                        Alert.alert("Success", "Budget deleted successfully!");
                    } catch (error) {
                        console.error("Error deleting budget:", error);
                        Alert.alert("Error", "Failed to delete budget. Please try again.");
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <Text style={styles.header}>Set Your Budgets</Text>

            {/* Input Fields to Add New Budget */}
            <View style={styles.addBudgetContainer}>
                <Text style={styles.label}>Budget Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter budget name (e.g., Grocery)"
                    placeholderTextColor="#888"
                    value={newBudgetName}
                    onChangeText={setNewBudgetName}
                />
                <Text style={styles.label}>Budget Amount</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter budget amount (e.g., 1000)"
                    placeholderTextColor="#888"
                    value={newBudgetAmount}
                    onChangeText={setNewBudgetAmount}
                    keyboardType="numeric"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddBudget}>
                    <Text style={styles.addButtonText}>Add Budget</Text>
                </TouchableOpacity>
            </View>

            {/* Budget List */}
            <FlatList
                data={budgets}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                    <Text style={styles.emptyMessage}>No budgets set. Add one above!</Text>
                )}
                renderItem={({ item }) => (
                    <View style={styles.budgetItem}>
                        <Text style={styles.budgetName}>{item.name}</Text>
                        {editingBudgetId === item.id ? (
                            <View style={styles.editContainer}>
                                <TextInput
                                    style={styles.input}
                                    defaultValue={item.amount.toString()}
                                    keyboardType="numeric"
                                    onChangeText={setNewBudgetAmount}
                                />
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={() => handleUpdateBudget(item.id, newBudgetAmount)}
                                >
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setEditingBudgetId(null)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => setEditingBudgetId(item.id)}>
                                <Text style={styles.budgetAmount}>${item.amount.toFixed(2)}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteBudget(item.id)}
                        >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f8f8f8",
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    addBudgetContainer: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 4,
        color: "#333",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        backgroundColor: "#f9f9f9",
        fontSize: 16,
        color: "#333",
    },
    addButton: {
        backgroundColor: "#4CAF50",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    emptyMessage: {
        textAlign: "center",
        fontSize: 16,
        color: "#888",
        marginTop: 20,
    },
    budgetItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    budgetName: {
        fontSize: 16,
        fontWeight: "bold",
    },
    budgetAmount: {
        fontSize: 16,
        color: "#4CAF50",
    },
    deleteButton: {
        backgroundColor: "#FF4F4F",
        padding: 8,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    editContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    saveButton: {
        backgroundColor: "#4CAF50",
        padding: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    cancelButton: {
        marginLeft: 8,
        padding: 8,
    },
    cancelButtonText: {
        color: "#888",
    },
});

export default SetBudget;
