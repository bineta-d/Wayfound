import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CollaborateScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Collaborate</Text>
            <View style={styles.separator} />
            <Text style={styles.content}>Collaborate with others here</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
    content: {
        fontSize: 16,
        color: '#666',
    },
});
