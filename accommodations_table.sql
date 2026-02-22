-- Accommodations table for trip bookings
-- Stores accommodation details for each trip

CREATE TABLE accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Home in {destination city}',
    address TEXT NOT NULL,
    google_place_id VARCHAR(255), -- For linking to Google Places
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    booking_confirmation_number VARCHAR(100),
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    guest_count INTEGER DEFAULT 1,
    room_type VARCHAR(100), -- single, double, suite, etc. (optional cuz could be whole house or airbnb)
    amenities TEXT[], -- Array of amenities: WiFi, parking, breakfast, etc.
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_accommodations_trip_id ON accommodations(trip_id);
CREATE INDEX idx_accommodations_google_place_id ON accommodations(google_place_id);

-- Comments for AI processing
COMMENT ON TABLE accommodations IS 'Stores accommodation bookings for trips with AI processing support';
COMMENT ON COLUMN accommodations.id IS 'Unique identifier for each accommodation';
COMMENT ON COLUMN accommodations.trip_id IS 'Link to the trip this accommodation belongs to';
COMMENT ON COLUMN accommodations.name IS 'Accommodation name, defaults to home city if not specified';
COMMENT ON COLUMN accommodations.address IS 'Full address extracted from Google Places';
COMMENT ON COLUMN accommodations.google_place_id IS 'Google Places ID for linking and verification';
COMMENT ON COLUMN accommodations.check_in_time IS 'Check-in date and time with timezone';
COMMENT ON COLUMN accommodations.check_out_time IS 'Check-out date and time with timezone';
COMMENT ON COLUMN accommodations.booking_confirmation_number IS 'Booking reference number from provider';
COMMENT ON COLUMN accommodations.total_price IS 'Total cost in specified currency';
COMMENT ON COLUMN accommodations.currency IS 'Currency code (USD, EUR, etc.)';
COMMENT ON COLUMN accommodations.guest_count IS 'Number of guests for the accommodation';
COMMENT ON COLUMN accommodations.room_type IS 'Type: single, double, suite, entire home, etc.';
COMMENT ON COLUMN accommodations.amenities IS 'Array of available amenities';
COMMENT ON COLUMN accommodations.contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN accommodations.contact_email IS 'Contact email for booking';

-- Sample data for testing
INSERT INTO accommodations (trip_id, name, address, google_place_id, check_in_time, check_out_time, total_price, guest_count, room_type, amenities, contact_phone, contact_email) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Marriott Times Square',
    'Times Square, New York, NY 10036, United States',
    'ChIJrTLrG-nWBsR9DwEWH5Y',
    '2024-06-15 15:00:00-04:00',
    '2024-06-18 11:00:00-04:00',
    450.00,
    'USD',
    2,
    'Deluxe King Room',
    ARRAY['WiFi', 'Gym', 'Restaurant', 'Room Service', 'Spa'],
    '+1-212-555-0123',
    'booking@marriott.com'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Airbnb Brooklyn Heights',
    '123 Smith St, Brooklyn, NY 11201, United States',
    'ChIJd8fbQyL9kRq8ZwTJCGu',
    '2024-07-10 14:00:00-04:00',
    '2024-07-15 10:00:00-04:00',
    280.50,
    'USD',
    4,
    'Entire Apartment',
    ARRAY['WiFi', 'Kitchen', 'Laundry', 'Air Conditioning'],
    '+1-718-555-9876',
    'contact@airbnb.com'
);
