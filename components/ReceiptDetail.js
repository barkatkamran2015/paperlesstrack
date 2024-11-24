import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const ReceiptDetail = ({ route }) => {
    const { receiptData } = route.params;
    const [category, setCategory] = useState(receiptData.category);
    const [logoUrl, setLogoUrl] = useState(receiptData.logoUrl || null); // Set initial logo URL
    const navigation = useNavigation();

    console.log('Receipt Data:', receiptData); // Debug receipt data

    // Domain mapping for known vendors
    const vendorDomainMapping = {
        ikea: 'ikea.com',
        walmart: 'walmart.com',
        costco: 'costco.com',
        'real canadian superstore': 'realcanadiansuperstore.ca',
        winners: 'winners.ca',
        'homesensf': 'winners.ca'
        // Add more vendors as needed
    };

    useEffect(() => {
        if (route.params?.selectedCategory) {
            setCategory(route.params.selectedCategory);
            updateCategoryOnServer(route.params.selectedCategory);
        }

        // Attempt to fetch logo if not provided
        if (!logoUrl && receiptData.vendor) {
            fetchCompanyLogo(receiptData.vendor, receiptData.vendor_logo);
        }
    }, [route.params?.selectedCategory, logoUrl, receiptData.vendor]);

    // Fetch company logo with fallback mechanisms
    const fetchCompanyLogo = async (vendorName, vendorLogoUrl) => {
        const normalizedVendor = vendorName.toLowerCase().trim();
        const mappedDomain = vendorDomainMapping[normalizedVendor];

        // 1. If vendor domain mapping exists, use Clearbit API
        if (mappedDomain) {
            setLogoUrl(`https://logo.clearbit.com/${mappedDomain}`);
            return;
        }

        // 2. Use Veryfi's vendor_logo field if provided
        if (vendorLogoUrl) {
            setLogoUrl(vendorLogoUrl);
            return;
        }

        // 3. Fallback to Clearbit's domain logo API
        try {
            const response = await axios.get(`https://logo.clearbit.com/${normalizedVendor}.com`);
            setLogoUrl(response.request.responseURL); // Set fetched logo URL
        } catch (error) {
            console.error(`Error fetching Clearbit logo for ${vendorName}:`, error.message);
            setLogoUrl(null); // Fallback if Clearbit fails
        }

        // 4. Final fallback to local placeholder logo
        setLogoUrl(require('../assets/fallback-logo.png')); // Replace with your fallback logo path
    };

    // Update the category on the server
    const updateCategoryOnServer = async (newCategory) => {
        try {
            const response = await axios.put('http://10.0.0.89:5000/api/update-receipt', {
                id: receiptData.id,
                category: newCategory,
            });
            console.log('Category updated:', response.data);
            Alert.alert('Success', 'Category updated successfully');
        } catch (error) {
            console.error('Error updating category:', error);
            Alert.alert('Error', 'Failed to update category');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>{receiptData.vendor || 'Unknown Vendor'}</Text>
            {logoUrl ? (
                <Image source={typeof logoUrl === 'string' ? { uri: logoUrl } : logoUrl} style={styles.logo} />
            ) : (
                <Text style={styles.logoPlaceholder}>Logo Not Available</Text>
            )}
            <Text style={styles.subHeader}>Tap here or the receipt to show the original image</Text>
            <View style={styles.receiptBox}>
                <Text style={styles.receiptDate}>{receiptData.date || 'Date: N/A'}</Text>
                <View style={styles.divider} />
                <Text style={styles.receiptCategory}>Category: {category || 'Uncategorized'}</Text>
                <View style={styles.divider} />
                {receiptData.items && receiptData.items.length > 0 ? (
                    <View style={styles.itemListContainer}>
                        {receiptData.items.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={styles.itemText}>{item}</Text>
                                <View style={styles.itemDivider} />
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noItemsText}>No items available</Text>
                )}
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Subtotal:</Text>
                    <Text style={styles.value}>{`$${receiptData.subtotal || (receiptData.total - 0.75).toFixed(2)}`}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Tax:</Text>
                    <Text style={styles.value}>$0.75</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Tip:</Text>
                    <Text style={styles.value}>$0.00</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Total:</Text>
                    <Text style={styles.value}>{`$${receiptData.total.toFixed(2)}`}</Text>
                </View>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('CategoryPage', { selectedCategory: category })}
                >
                    <Text style={styles.buttonText}>Category</Text>
                </TouchableOpacity>

                <TouchableOpacity
    style={styles.button}
    onPress={() =>
        navigation.navigate('EditReceipt', {
            receipt: {
                ...receiptData,
                docId: receiptData.docId || receiptData.id, // Ensure Firestore docId is included
            },
        })
    }
>
    <Text style={styles.buttonText}>Edit</Text>
</TouchableOpacity>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f5',
        padding: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        color: '#1f2937',
    },
    subHeader: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 15,
    },
    receiptBox: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginBottom: 20,
    },
    logo: {
        width: 120,
        height: 40,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginVertical: 10,
    },
    logoPlaceholder: {
        textAlign: 'center',
        color: '#888',
        fontSize: 16,
        marginVertical: 10,
    },
    receiptDate: {
        fontSize: 16,
        textAlign: 'left',
        color: '#4b5563',
        marginBottom: 8,
    },
    receiptCategory: {
        fontSize: 18,
        textAlign: 'left',
        fontWeight: '600',
        marginBottom: 8,
        color: '#111827',
    },
    itemListContainer: {
        marginBottom: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemText: {
        fontSize: 16,
        color: '#374151',
    },
    itemDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginVertical: 5,
    },
    noItemsText: {
        textAlign: 'center',
        marginTop: 10,
        color: '#888',
    },
    divider: {
        borderBottomColor: '#d1d5db',
        borderBottomWidth: 1,
        marginVertical: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        fontSize: 15,
        color: '#374151',
    },
    value: {
        fontSize: 15,
        color: '#374151',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 25,
    },
    button: {
        backgroundColor: '#14532d',
        padding: 12,
        borderRadius: 8,
        width: '42%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    },
});

export default ReceiptDetail;
