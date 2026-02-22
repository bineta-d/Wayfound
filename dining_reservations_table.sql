-- Dining Reservations table for restaurant bookings
-- Stores restaurant reservations with AI processing support

CREATE TABLE dining_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(255) NOT NULL,
    google_place_id VARCHAR(255), -- For linking to Google Places
    address TEXT NOT NULL, -- Extracted from booking confirmation
    reservation_time TIMESTAMP WITH TIME ZONE,
    party_size INTEGER DEFAULT 1,
    special_requests TEXT, -- Dietary restrictions, seating preferences, etc.
    confirmation_number VARCHAR(100), -- Booking reference number
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    cuisine_type VARCHAR(100), -- Italian, Mexican, Asian, etc. (optional)
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, pending, cancelled, no-show
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dining_trip_id ON dining_reservations(trip_id);
CREATE INDEX idx_dining_google_place_id ON dining_reservations(google_place_id);
CREATE INDEX idx_dining_status ON dining_reservations(booking_status);

-- Comments for AI processing
COMMENT ON TABLE dining_reservations IS 'Stores restaurant reservations with AI text extraction support';
COMMENT ON COLUMN dining_reservations.id IS 'Unique identifier for each dining reservation';
COMMENT ON COLUMN dining_reservations.trip_id IS 'Link to the trip this reservation belongs to';
COMMENT ON COLUMN dining_reservations.restaurant_name IS 'Restaurant name from booking';
COMMENT ON COLUMN dining_reservations.google_place_id IS 'Google Places ID for location linking';
COMMENT ON COLUMN dining_reservations.address IS 'Restaurant address extracted from booking docs';
COMMENT ON COLUMN dining_reservations.reservation_time IS 'Date and time of reservation with timezone';
COMMENT ON COLUMN dining_reservations.party_size IS 'Number of people in the dining party';
COMMENT ON COLUMN dining_reservations.special_requests IS 'Dietary needs, seating preferences, etc.';
COMMENT ON COLUMN dining_reservations.confirmation_number IS 'Booking reference for verification';
COMMENT ON COLUMN dining_reservations.total_price IS 'Total cost including tax and tip';
COMMENT ON COLUMN dining_reservations.currency IS 'Currency code for price';
COMMENT ON COLUMN dining_reservations.cuisine_type IS 'Type of cuisine (optional)';
COMMENT ON COLUMN dining_reservations.booking_status IS 'Current reservation status';
COMMENT ON COLUMN dining_reservations.contact_phone IS 'Restaurant contact number';
COMMENT ON COLUMN dining_reservations.contact_email IS 'Restaurant contact email';

-- Sample data for testing
INSERT INTO dining_reservations (trip_id, restaurant_name, google_place_id, address, reservation_time, party_size, special_requests, confirmation_number, total_price, booking_status) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Carbone',
    'ChIJd8fbQyL9kRq8ZwTJCGu',
    '375 Greenwich St, New York, NY 10014, USA',
    '2024-06-16 19:30:00-04:00',
    4,
    'Vegetarian options requested',
    'REST789012',
    125.00,
    'USD',
    'confirmed'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Joe\'s Pizza',
    'ChIJrTLrG-nWBsR9DwEWH5Y',
    '123 Main St, Brooklyn, NY 11201, USA',
    '2024-07-11 18:00:00-04:00',
    2,
    'No special requests',
    'PIZZ456789',
    45.50,
    'USD',
    'confirmed'
);
