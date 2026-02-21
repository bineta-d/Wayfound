import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext'
import Alert from 'react-native'
import { User, Trip } from './types'
import { StructuredDay } from '@/types/activity';
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
            ('trips').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
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
        const memberData = [];

        for (const member of members) {
            // Check if user exists with this email
            const { data: existingUser, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', member.email)
                .single();

            let userId;
            if (existingUser && !userError) {
                // User exists, use their UUID
                userId = existingUser.id;

                memberData.push({
                    trip_id: trip_id,
                    user_id: userId,
                    role: 'member'
                });
            } else {
                // to do:   store pending invitations
                console.log(`User with email ${member.email} not found. Skipping member addition.`);
            }
        }

        // Only insert if we have valid members
        if (memberData.length > 0) {
            const { data, error } = await supabase
                .from('trip_members')
                .insert(memberData);

            if (error) {
                throw error;
            }

            return data;
        } else {
            return [];
        }
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

// get shared trips (trips where user is a member but not owner)
export const getSharedTrips = async (user: SupabaseUser) => {
    try {
        console.log('🔍 Getting shared trips for user:');
        console.log('  - User ID:', user.id);
        console.log('  - User Email:', user.email);

        // Get all trips first (user can access their own trips)
        const { data: userTrips, error: userTripsError } = await supabase
            .from('trips')
            .select('*')
            .eq('owner_id', user.id);

        if (userTripsError) {
            console.error('🔍 User trips error:', userTripsError);
            throw userTripsError;
        }

        console.log('🔍 User owns these trips:', userTrips?.map(t => ({ id: t.id, title: t.title })));

        // get user's trip memberships
        const { data: memberships, error: membershipError } = await supabase
            .from('trip_members')
            .select('trip_id')
            .eq('user_id', user.id)
            .eq('role', 'member');

        if (membershipError) {
            console.error('🔍 Membership error:', membershipError);
            throw membershipError;
        }

        console.log('🔍 User is member of these trip_ids:', memberships);

        if (!memberships || memberships.length === 0) {
            console.log('🔍 No memberships found');
            return [];
        }

        // filter out trips the user owns and remove duplicates
        const ownedTripIds = userTrips?.map(t => t.id) || [];
        const allSharedTripIds = memberships.map(m => m.trip_id);
        const uniqueSharedTripIds = [...new Set(allSharedTripIds)]; // Remove duplicates
        const sharedTripIds = uniqueSharedTripIds.filter(tripId => !ownedTripIds.includes(tripId));

        console.log('🔍 All shared trip IDs:', allSharedTripIds);
        console.log('🔍 Unique shared trip IDs:', uniqueSharedTripIds);
        console.log('🔍 Shared trip IDs (excluding owned):', sharedTripIds);

        if (sharedTripIds.length === 0) {
            console.log('🔍 No shared trips after filtering');
            return [];
        }


        console.log('🔍 Getting real trip data...');

        // try to get trip data by checking each trip individually
        const sharedTrips = [];
        for (const tripId of sharedTripIds) {
            console.log('🔍 Checking trip:', tripId);

            // try to get trip data 
            const { data: tripData, error: tripError } = await supabase
                .from('trips')
                .select('*')
                .eq('id', tripId)
                .single();

            if (tripError) {
                console.log('🔍 Could not access trip data for:', tripId, tripError);
                // placeholder if failed
                sharedTrips.push({
                    id: tripId,
                    title: 'Shared Trip (Access Restricted)',
                    destination: 'Trip details hidden',
                    start_date: '2026-01-01',
                    end_date: '2026-01-02',
                    owner_id: 'restricted',
                    created_at: new Date().toISOString()
                });
            } else {
                console.log('🔍 Got trip data:', tripData);
                sharedTrips.push(tripData);
            }
        }

        console.log('🔍 Final shared trips:', sharedTrips);
        return sharedTrips;
    } catch (error) {
        console.error('Error getting shared trips:', error);
        throw error;
    }
};

// get trip members
export const getTripMembers = async (trip_id: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('trip_members')
            .select(`
                id,
                trip_id,
                user_id,
                name,
                email,
                role,
                users (
                    id,
                    full_name,
                    email,
                    avatar_url
                )
            `)
            .eq('trip_id', trip_id)
            .order('role', { ascending: false })
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        console.log('🔍 Trip members data:', data);
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

