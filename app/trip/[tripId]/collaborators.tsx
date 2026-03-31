import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import InviteModal from '../../../components/InviteModal';
import { Trip_member } from '../../../lib/types';

interface CollaboratorsScreenProps {
    members: Trip_member[];
    currentUserId?: string;
}

export default function CollaboratorsScreen({ members, currentUserId }: CollaboratorsScreenProps) {
    console.log('🔍 Collaborators received:', members);

    // add state to control when the pop-up is visible
    const [isModalVisible, setModalVisible] = useState(false);

    // Grab  exact Trip ID from the screen background data
    const { tripId } = useLocalSearchParams();

    // Function to check if current user is the trip owner
    const isOwner = (member: Trip_member) => {
        return currentUserId === member.trip_owner_id;
    };

    return (
        <View className="bg-white px-6 py-6 mb-2">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Collaborators</Text>
                <TouchableOpacity
                    className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center"
                    onPress={() => setModalVisible(true)}
                >
                    <Text className="text-white font-semibold text-lg">+</Text>
                </TouchableOpacity>
            </View>

            {members.length === 0 ? (
                <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <Text className="text-gray-500 text-center">
                        No collaborators added yet
                    </Text>
                </View>
            ) : (
                <View className="space-y-3">
                    {members.map((member: Trip_member) => {
                        function handleRemoveCollaborator(id: string, arg1: string): void {
                            throw new Error('Function not implemented.');
                        }

                        return (
                            <View key={member.id} className="flex-row items-center bg-gray-50 rounded-lg p-3">
                                {member.users?.avatar_url ? (
                                    <Image
                                        source={{ uri: member.users.avatar_url }}
                                        className="w-10 h-10 rounded-full mr-3"
                                    />
                                ) : (
                                    <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
                                        <Text className="text-white font-semibold text-lg">
                                            {member.users?.full_name ? member.users.full_name.charAt(0).toUpperCase() :
                                                member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                                        </Text>
                                    </View>
                                )}
                                <View className="flex-1">
                                    <Text className="text-gray-800 font-medium">
                                        {member.users?.full_name || member.name || 'Unknown User'}
                                    </Text>
                                    <Text className="text-gray-500 text-sm">
                                        {member.users?.email || member.email || 'No email'}
                                    </Text>
                                </View>
                                <View className="bg-green-100 px-2 py-1 rounded">
                                    <Text className="text-green-700 text-xs font-medium capitalize">
                                        {member.role}
                                    </Text>
                                </View>

                                {/* Delete button - only show for non-owners */}
                                {!isOwner(member) && (
                                    <TouchableOpacity
                                        className="bg-red-500 w-6 h-6 rounded-full items-center justify-center ml-2"
                                        onPress={() => handleRemoveCollaborator(member.id, member.users?.full_name || member.name || 'Unknown User')}
                                    >
                                        <Text className="text-white font-bold text-sm">×</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}

            {/*  pop-up box stays invisible until the + button is clicked */}
            <InviteModal
                isVisible={isModalVisible}
                onClose={() => setModalVisible(false)}
                tripId={tripId as string}
            />
        </View>
    );
}