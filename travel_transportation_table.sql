-- Travel Transportation table for flights, trains, buses, car rentals
-- Stores transportation bookings with AI processing support

CREATE TABLE travel_transportation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    transport_type VARCHAR(50) NOT NULL, -- flight, train, bus, car_rental, ferry, etc.
    provider_name VARCHAR(255), -- Airline, train company, rental agency
    confirmation_number VARCHAR(100), -- Booking confirmation/reference number
    departure_location TEXT NOT NULL, -- Extracted from booking docs
    arrival_location TEXT NOT NULL, -- Extracted from booking docs
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    passenger_count INTEGER DEFAULT 1,
    seat_class VARCHAR(50), -- economy, business, first, etc. (optional)
    baggage_allowance TEXT, -- Extracted from booking docs
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, pending, cancelled
    google_place_id VARCHAR(255), -- For linking to Google Places
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transportation_trip_id ON travel_transportation(trip_id);
CREATE INDEX idx_transportation_type ON travel_transportation(transport_type);

-- Comments for AI processing
COMMENT ON TABLE travel_transportation IS 'Stores all transportation bookings with AI text extraction support';
COMMENT ON COLUMN travel_transportation.id IS 'Unique identifier for each transportation booking';
COMMENT ON COLUMN travel_transportation.trip_id IS 'Link to the trip this transport belongs to';
COMMENT ON COLUMN travel_transportation.transport_type IS 'Type: flight, train, bus, car_rental, ferry';
COMMENT ON COLUMN travel_transportation.provider_name IS 'Airline, train company, rental agency name';
COMMENT ON COLUMN travel_transportation.confirmation_number IS 'Booking reference for verification';
COMMENT ON COLUMN travel_transportation.departure_location IS 'Departure location extracted from booking documents';
COMMENT ON COLUMN travel_transportation.arrival_location IS 'Arrival location extracted from booking documents';
COMMENT ON COLUMN travel_transportation.departure_time IS 'Departure date and time with timezone';
COMMENT ON COLUMN travel_transportation.arrival_time IS 'Arrival date and time with timezone';
COMMENT ON COLUMN travel_transportation.total_price IS 'Total cost in specified currency';
COMMENT ON COLUMN travel_transportation.currency IS 'Currency code for price';
COMMENT ON COLUMN travel_transportation.passenger_count IS 'Number of passengers';
COMMENT ON COLUMN travel_transportation.seat_class IS 'Service class: economy, business, first';
COMMENT ON COLUMN travel_transportation.baggage_allowance IS 'Baggage info extracted from booking docs';
COMMENT ON COLUMN travel_transportation.booking_status IS 'Current booking status';
COMMENT ON COLUMN travel_transportation.google_place_id IS 'Google Places ID for location linking';

-- Sample data for testing
INSERT INTO travel_transportation (trip_id, transport_type, provider_name, confirmation_number, departure_location, arrival_location, departure_time, arrival_time, total_price, passenger_count, seat_class, baggage_allowance, booking_status) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'flight',
    'Delta Air Lines',
    'DL123456',
    'John F. Kennedy International Airport, New York, NY, USA',
    'Los Angeles International Airport, Los Angeles, CA, USA',
    '2024-06-20 08:00:00-04:00',
    '2024-06-20 11:30:00-07:00',
    650.00,
    'USD',
    2,
    'economy',
    '1 carry-on + 1 checked bag (23kg)',
    'confirmed'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'train',
    'Amtrak',
    'AMTK789012',
    'Penn Station, New York, NY',
    'Union Station, Washington, DC',
    '2024-07-12 09:00:00-04:00',
    '2024-07-12 14:30:00-04:00',
    180.00,
    'USD',
    1,
    'business',
    '2 carry-on bags + 2 checked bags',
    'confirmed'
);
