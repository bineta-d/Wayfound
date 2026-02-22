export interface User {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
}

export interface Trip {
    id: string;
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    budget: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Activity {
    id: string;
    trip_id: string;
    title: string;
    description: string;
    location: string;
    time: string;
    created_at: string;
}

export interface Booking {
    id: string;
    trip_id: string;
    type: 'hotel' | 'flight' | 'car' | 'activity';
    confirmation_number: string;
    cost: number;
    created_at: string;
}

export interface Collaborator {
    id: string;
    trip_id: string;
    user_id: string;
    role: 'owner' | 'editor' | 'viewer';
    invited_at: string;
    joined_at?: string;
}
