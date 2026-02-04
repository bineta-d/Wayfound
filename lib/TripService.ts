import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext'
import Alert from 'react-native'
import { User } from './types'


export const createTrip = async (title: string, destination: string, start_date: string, end_date: string, owner_id: string) => {
    const { data, error } = await supabase
        .from('trips').insert({
            owner_id: owner_id,
            title: title,
            destination: destination,
            start_date: start_date,
            end_date: end_date,
        });

    if (error) {
        throw error;
    }

    return data;
};


// edit trip 

// get all trip for user

export const getUserTrips = async (user: User) => {
    try {
        const { data, error } = await supabase.from
            ('trips').select('*').eq('owner_id', user.id)
        if (error) {
            throw error
            console.log("❌ Trips not found: " + error)
        }
        console.log("✅ This is trip info: " + data)
        return data;
    }

// delete trips

// get trip by id 

// get trip by location
