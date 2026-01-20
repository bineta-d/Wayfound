import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function CreateScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Trip</Text>
            <View style={styles.separator} />
            <Text style={styles.content}>Start planning your next adventure</Text>

            <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createButtonText}>+ Create New Trip</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
        backgroundColor: '#eee',
    },
    content: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
    },
    createButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
