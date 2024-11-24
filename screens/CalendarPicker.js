import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CalendarPicker = ({ onDateRangeChange }) => {
    const months = [
        "January", "February", "March", "April", "May", "June", "July", "August",
        "September", "October", "November", "December",
    ];

    const currentMonth = new Date().getMonth();
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [pickerMode, setPickerMode] = useState('start'); // 'start' or 'end'
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleMonthSelect = (index) => {
        setSelectedMonth(index);
    };

    const handleDateChange = (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
            const updatedRange = { ...selectedRange };
            if (pickerMode === 'start') {
                updatedRange.startDate = selectedDate;
                setSelectedRange(updatedRange);
                setPickerMode('end'); // After selecting start date, switch to end date
                setIsPickerOpen(true); // Open end date picker
            } else if (pickerMode === 'end') {
                updatedRange.endDate = selectedDate;
                setSelectedRange(updatedRange);
                onDateRangeChange(updatedRange.startDate, updatedRange.endDate); // Send to parent
                setIsPickerOpen(false); // Close picker after selecting end date
            }
        } else {
            setIsPickerOpen(false); // Close picker if user cancels
        }
    };

    const openDatePicker = () => {
        setPickerMode('start'); // Start picking start date
        setIsPickerOpen(true);
    };

    return (
        <View style={styles.headerContainer}>
            {/* Title and Calendar Icon */}
            <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>Billing Reports</Text>
                <TouchableOpacity onPress={openDatePicker}>
                    <MaterialCommunityIcons name="calendar" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Month Navigation Bar */}
            <FlatList
                data={months}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        style={[
                            styles.monthItem,
                            selectedMonth === index && styles.selectedMonthItem,
                        ]}
                        onPress={() => handleMonthSelect(index)}
                    >
                        <Text
                            style={[
                                styles.monthText,
                                selectedMonth === index && styles.selectedMonthText,
                            ]}
                        >
                            {item}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* DateTimePicker for Start Date */}
            {isPickerOpen && pickerMode === 'start' && (
                <DateTimePicker
                    value={selectedRange.startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date(2020, 0, 1)} // Optional: set minimum date
                    maximumDate={new Date()} // Optional: set maximum date
                />
            )}

            {/* DateTimePicker for End Date */}
            {isPickerOpen && pickerMode === 'end' && (
                <DateTimePicker
                    value={selectedRange.endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={selectedRange.startDate || new Date()} // Ensure end date is after start date
                    maximumDate={new Date()} // Optional: set maximum date
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#7B61FF', // Purple background
        padding: 16,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    monthItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginHorizontal: 4,
        borderRadius: 16,
    },
    selectedMonthItem: {
        backgroundColor: '#FFF',
    },
    monthText: {
        fontSize: 14,
        color: '#FFF',
    },
    selectedMonthText: {
        color: '#7B61FF',
        fontWeight: 'bold',
    },
});

export default CalendarPicker;
