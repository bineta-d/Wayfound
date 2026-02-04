import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext'
import Alert from 'react-native'
import { User, Trip } from './types'
import { User as SupabaseUser } from '@supabase/supabase-js';


export const createTrip = async (title: string, destination: string, start_date: string, end_date: string, owner_id: string): Promise<Trip[]> => {
    const { data, error } = await supabase
        .from('trips').insert({
            owner_id: owner_id,
            title: title,
            destination: destination,
            start_date: start_date,
            end_date: end_date,
        }).select();

    if (error) {
        throw error;
    }

    return data || [];
};

// get all trips for user
export const getUserTrips = async (user: SupabaseUser) => {
    try {
        const { data, error } = await supabase.from
            ('trips').select('*').eq('owner_id', user.id)
        if (error) {
            throw error
            console.log("❌ Trips not found: " + error)
        }
        console.log("✅ This is trip info: " + data)
        return data || [];
    } catch (error) {
        console.error('Error getting user trips:', error);
        throw error;
    }
}

// create trip members
export const createTripMembers = async (trip_id: string, members: { name: string, email: string }[]) => {
    try {
        const { data, error } = await supabase
            .from('trip_members')
            .insert(
                members.map(member => ({
                    trip_id: trip_id,
                    user_id: member.email, // For now using email as user_id, should be updated to actual user_id after user lookup
                    role: 'member'
                }))
            );

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error creating trip members:', error);
        throw error;
    }
};

// edit trip
export const updateTrip = async (trip_id: string, updates: { title?: string, destination?: string, start_date?: string, end_date?: string }): Promise<Trip[]> => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .update(updates)
            .eq('id', trip_id)
            .select();

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error updating trip:', error);
        throw error;
    }
};

// delete trips
export const deleteTrip = async (trip_id: string): Promise<void> => {
    try {
        // First delete all trip members
        const { error: membersError } = await supabase
            .from('trip_members')
            .delete()
            .eq('trip_id', trip_id);

        if (membersError) {
            throw membersError;
        }

        // Then delete the trip
        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', trip_id);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error deleting trip:', error);
        throw error;
    }
};

// get trip by id
export const getTripById = async (trip_id: string): Promise<Trip | null> => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('id', trip_id)
            .single();

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error getting trip by ID:', error);
        throw error;
    }
};

// get trip by location
export const getTripsByLocation = async (location: string): Promise<Trip[]> => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .ilike('destination', `%${location}%`);

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error getting trips by location:', error);
        throw error;
    }
};

// get trip members
export const getTripMembers = async (trip_id: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('trip_members')
            .select('*')
            .eq('trip_id', trip_id);

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error getting trip members:', error);
        throw error;
    }
};

// remove trip member
export const removeTripMember = async (trip_id: string, user_id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('trip_members')
            .delete()
            .eq('trip_id', trip_id)
            .eq('user_id', user_id);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error removing trip member:', error);
        throw error;
    }
};
