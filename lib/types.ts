
interface Trip {
    id: string
    owner_id: string,
    title: string,
    destination: string,
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
}


interface Trip_member {
    id: string,
    trip_id: string,
    user_id: string,
    role: string;
}

export interface User {
    id: string,
    full_name: string,
    email: string,
    created_at: string,
    dob: string,
    age: string,
    updated_at?: string;
}