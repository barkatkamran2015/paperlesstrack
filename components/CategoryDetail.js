import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { firestore } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const CategoryDetail = ({ route }) => {
    const { category } = route.params; // Get category from navigation params
    const [entries, setEntries] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null); // Store the entry being edited
    const [newAmount, setNewAmount] = useState(''); // Store the new amount input
    const navigation = useNavigation(); // Access the navigation object

    useEffect(() => {
        // Query Firestore for entries with the selected category
        const q = query(collection(firestore, "incomes"), where("category", "==", category));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEntries = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setEntries(fetchedEntries);
        });

        return () => unsubscribe();
    }, [category]);

    const handleEdit = async (id, newAmount) => {
        try {
            const docRef = doc(firestore, "incomes", id);
            await updateDoc(docRef, { total: parseFloat(newAmount) });
            Alert.alert("Success", "Entry updated successfully");
            setModalVisible(false); // Close the modal
        } catch (error) {
            console.error("Error updating entry:", error);
            Alert.alert("Error", "Failed to update entry");
        }
    };

    const openEditModal = (entry) => {
        setSelectedEntry(entry); // Set the selected entry
        setNewAmount(entry.total.toString()); // Pre-fill the amount
        setModalVisible(true); // Open the modal
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Entries for {category.toUpperCase()}</Text>
            
            {/* Cancel/Return Button */}
            <TouchableOpacity
                style={styles.returnButton}
                onPress={() => navigation.goBack()} // Navigate back to IncomePage
            >
                <Text style={styles.returnButtonText}>Return to Income Page</Text>
            </TouchableOpacity>
            
            <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.entryItem}>
                        <Text style={styles.entryText}>Amount: ${item.total.toFixed(2)}</Text>
                        <Text style={styles.entryText}>Date: {new Date(item.date).toLocaleDateString()}</Text>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => openEditModal(item)} // Open the modal for editing
                        >
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Edit Modal */}
            {modalVisible && (
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Entry</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={newAmount}
                                onChangeText={setNewAmount}
                                placeholder="Enter new amount"
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={() => handleEdit(selectedEntry.id, newAmount)}
                                >
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setModalVisible(false)} // Close the modal
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f9f9f9",
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    returnButton: {
        marginBottom: 15,
        backgroundColor: "#6200EE",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: "center",
    },
    returnButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    entryItem: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    entryText: {
        fontSize: 16,
        marginBottom: 5,
    },
    editButton: {
        marginTop: 10,
        backgroundColor: "#6200EE",
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: "center",
    },
    editButtonText: {
        color: "#fff",
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
    },
    input: {
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    saveButton: {
        backgroundColor: "#6200EE",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    cancelButton: {
        marginLeft: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: "#ccc",
    },
    cancelButtonText: {
        color: "#333",
        fontWeight: "bold",
    },
});

export default CategoryDetail;
