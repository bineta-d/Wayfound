-- Activity Bookings table for tours, attractions, events
-- Stores activity reservations with AI processing support

CREATE TABLE activity_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    activity_name VARCHAR(255) NOT NULL,
    google_place_id VARCHAR(255), -- For linking to Google Places
    address TEXT NOT NULL, -- Extracted from booking confirmation
    activity_date TIMESTAMP WITH TIME ZONE,
    start_time TIME, -- Start time of the activity
    end_time TIME, -- End time of the activity
    participant_count INTEGER DEFAULT 1,
    confirmation_number VARCHAR(100), -- Booking reference number
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    activity_type VARCHAR(100), -- tour, museum, concert, sports, etc. (optional)
    difficulty_level VARCHAR(50), -- easy, moderate, challenging (optional)
    equipment_needed TEXT[], -- Required equipment: hiking gear, swimwear, etc. (optional)
    special_instructions TEXT, -- Meeting points, what to bring, etc.
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, pending, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activity_trip_id ON activity_bookings(trip_id);
CREATE INDEX idx_activity_google_place_id ON activity_bookings(google_place_id);
CREATE INDEX idx_activity_type ON activity_bookings(activity_type);
CREATE INDEX idx_activity_date ON activity_bookings(activity_date);

-- Comments for AI processing
COMMENT ON TABLE activity_bookings IS 'Stores activity bookings with AI text extraction support';
COMMENT ON COLUMN activity_bookings.id IS 'Unique identifier for each activity booking';
COMMENT ON COLUMN activity_bookings.trip_id IS 'Link to the trip this activity belongs to';
COMMENT ON COLUMN activity_bookings.activity_name IS 'Activity or attraction name from booking';
COMMENT ON COLUMN activity_bookings.google_place_id IS 'Google Places ID for location linking';
COMMENT ON COLUMN activity_bookings.address IS 'Activity location extracted from booking docs';
COMMENT ON COLUMN activity_bookings.activity_date IS 'Date of the activity with timezone';
COMMENT ON COLUMN activity_bookings.start_time IS 'Start time of the activity';
COMMENT ON COLUMN activity_bookings.end_time IS 'End time of the activity';
COMMENT ON COLUMN activity_bookings.participant_count IS 'Number of participants';
COMMENT ON COLUMN activity_bookings.confirmation_number IS 'Booking reference for verification';
COMMENT ON COLUMN activity_bookings.total_price IS 'Total cost per person or group';
COMMENT ON COLUMN activity_bookings.currency IS 'Currency code for price';
COMMENT ON COLUMN activity_bookings.activity_type IS 'Type: tour, museum, concert, sports, etc.';
COMMENT ON COLUMN activity_bookings.difficulty_level IS 'Physical difficulty: easy, moderate, challenging';
COMMENT ON COLUMN activity_bookings.equipment_needed IS 'Required equipment list';
COMMENT ON COLUMN activity_bookings.special_instructions IS 'Meeting points, what to bring, etc.';
COMMENT ON COLUMN activity_bookings.booking_status IS 'Current booking status';
COMMENT ON COLUMN activity_bookings.contact_phone IS 'Activity provider contact number';
COMMENT ON COLUMN activity_bookings.contact_email IS 'Activity provider contact email';

-- Sample data for testing
INSERT INTO activity_bookings (trip_id, activity_name, google_place_id, address, activity_date, start_time, end_time, participant_count, confirmation_number, total_price, activity_type, difficulty_level, special_instructions, booking_status) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Statue of Liberty Tour',
    'ChIJrTLrG-nWBsR9DwEWH5Y',
    'Liberty Island, New York, NY 10004, USA',
    '2024-06-17 10:00:00-04:00',
    '09:00:00',
    '12:00:00',
    4,
    'TOUR456789',
    89.00,
    'USD',
    'tour',
    'easy',
    'Meet at ferry terminal, bring comfortable walking shoes and camera',
    'confirmed'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Brooklyn Bridge Bike Tour',
    'ChIJd8fbQyL9kRq8ZwTJCGu',
    'Brooklyn Bridge, New York, NY 10038, USA',
    '2024-07-13 14:00:00-04:00',
    '14:00:00',
    '16:00:00',
    2,
    'BIKE789012',
    75.00,
    'USD',
    'tour',
    'moderate',
    'Bring water, sunscreen, and helmet. Meet at Brooklyn Bridge Park entrance',
    'confirmed'
);
