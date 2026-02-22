-- Activities table for trip activities
-- Stores individual activities for each trip day

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE, -- Separate trip reference for booked activities
    day_number INTEGER, -- Day number for booked activities
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_name VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    google_place_id VARCHAR(255), -- For linking to Google Places
    start_time TIME, -- Start time for activity
    end_time TIME, -- End time for activity
    price DECIMAL(10,2), -- Cost of activity in specified currency
    currency VARCHAR(3) DEFAULT 'USD', -- Currency code (USD, EUR, etc.)
    notes TEXT, -- Additional notes extracted from booking documents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_activities_itinerary_day_id ON activities(itinerary_day_id);
CREATE INDEX idx_activities_location ON activities(latitude, longitude);

-- Comments for AI processing
COMMENT ON TABLE activities IS 'Stores individual activities for each trip day with AI processing support';
COMMENT ON COLUMN activities.id IS 'Unique identifier for each activity';
COMMENT ON COLUMN activities.itinerary_day_id IS 'Link to itinerary day this activity belongs to';
COMMENT ON COLUMN activities.trip_id IS 'Separate trip reference for booked activities';
COMMENT ON COLUMN activities.day_number IS 'Day number for booked activities';
COMMENT ON COLUMN activities.title IS 'Activity title or name';
COMMENT ON COLUMN activities.description IS 'Detailed description of activity';
COMMENT ON COLUMN activities.location_name IS 'Location name extracted from Google Places or booking docs';
COMMENT ON COLUMN activities.latitude IS 'Latitude coordinate for location';
COMMENT ON COLUMN activities.longitude IS 'Longitude coordinate for location';
COMMENT ON COLUMN activities.google_place_id IS 'Google Places ID for location linking';
COMMENT ON COLUMN activities.start_time IS 'Start time for activity';
COMMENT ON COLUMN activities.end_time IS 'End time for activity';
COMMENT ON COLUMN activities.price IS 'Cost of activity in specified currency';
COMMENT ON COLUMN activities.currency IS 'Currency code (USD, EUR, etc.)';
COMMENT ON COLUMN activities.notes IS 'Additional notes extracted from booking documents';
COMMENT ON COLUMN activities.created_at IS 'When the activity was created';
COMMENT ON COLUMN activities.updated_at IS 'When the activity was last updated';

-- Sample data for testing (using existing real data)
INSERT INTO activities (id, itinerary_day_id, trip_id, day_number, title, description, location_name, latitude, longitude, google_place_id, start_time, end_time, price, currency, notes, created_at) VALUES
-- Budapest trip activities (existing data)
('05bc6e9c-bebd-45df-b866-e862bb7def5e', '6c201041-364b-4722-a33f-62b7c68f3985', null, null, 'Fisherman''s Bastion', 'Day 1:\nMorning (8:00-12:00): Explore Buda Castle District. Begin at Matthias Church (Mátyás-templom) for its stunning Gothic architecture, then wander through Fisherman''s Bastion (Halászbástya) for panoramic views of Pest.\nAfternoon (12:00-17:00): Lunch at Ruszwurm Confectionery (Ruszwurm Cukrászda) for traditional Hungarian pastries and coffee. Explore Hungarian National Gallery (Magyar Nemzeti Galéria) within Buda Castle.\nEvening (17:00-22:00): Enjoy dinner at 21 Magyar Vendéglő, a cozy restaurant serving authentic Hungarian cuisine in Castle District. Afterwards, take a romantic stroll along the illuminated Danube promenade.', 'Fisherman''s Bastion', 47.5021827, 19.0347813, null, '08:00:00', '12:00:00', null, null, 'Free walking tour, bring camera for photos', '2026-02-21 21:47:47.381204+00'),
('984d4fb9-3e72-43aa-833a-53ca4f3b128f', '6c201041-364b-4722-a33f-62b7c68f3985', null, null, 'Ruszwurm Confectionery', 'Day 1:\nMorning (8:00-12:00): Explore Buda Castle District. Begin at Matthias Church (Mátyás-templom) for its stunning Gothic architecture, then wander through Fisherman''s Bastion (Halászbástya) for panoramic views of Pest.\nAfternoon (12:00-17:00): Lunch at Ruszwurm Confectionery (Ruszwurm Cukrászda) for traditional Hungarian pastries and coffee. Explore Hungarian National Gallery (Magyar Nemzeti Galéria) within Buda Castle.\nEvening (17:00-22:00): Enjoy dinner at 21 Magyar Vendéglő, a cozy restaurant serving authentic Hungarian cuisine in Castle District. Afterwards, take a romantic stroll along the illuminated Danube promenade.', 'Ruszwurm Confectionery', 47.5012276, 19.0330045, null, '12:00:00', '17:00:00', null, null, 'Traditional Hungarian pastries and coffee, reservations recommended', '2026-02-21 21:47:47.381204+00'),
('e9ad4e8c-3e42-45f3-b827-1e3342daa73f', '6c201041-364b-4722-a33f-62b7c68f3985', null, null, '21 - Magyar Vendéglő - Hungarian bistro', 'Day 1:\nMorning (8:00-12:00): Explore Buda Castle District. Begin at Matthias Church (Mátyás-templom) for its stunning Gothic architecture, then wander through Fisherman''s Bastion (Halászbástya) for panoramic views of Pest.\nAfternoon (12:00-17:00): Lunch at Ruszwurm Confectionery (Ruszwurm Cukrászda) for traditional Hungarian pastries and coffee. Explore Hungarian National Gallery (Magyar Nemzeti Galéria) within Buda Castle.\nEvening (17:00-22:00): Enjoy dinner at 21 Magyar Vendéglő, a cozy restaurant serving authentic Hungarian cuisine in Castle District. Afterwards, take a romantic stroll along the illuminated Danube promenade.', '21 - Magyar Vendéglő - Hungarian bistro', 47.5041488, 19.0312872, null, '17:00:00', '22:00:00', 25.00, 'EUR', 'Traditional Hungarian cuisine, reservations recommended', '2026-02-21 21:47:47.381204+00'),
-- Nice trip activities
('eead1368-794b-4b01-9e75-e19bd695e05d', 'b5b0de1c-ab6f-4bf5-8d25-056de8b014d2', null, null, 'Promenade in Nice', null, 'ibis Nice Aéroport Promenade des Anglais, 359 Prom. des Anglais, 06200 Nice, France', 43.6714661, 7.224051399999999, null, null, null, null, null, null, '2026-02-22 15:51:34.615048+00'),
('9640db50-c8b6-4faa-9d2d-bed966395587', 'b5b0de1c-ab6f-4bf5-8d25-056de8b014d2', null, null, 'Checkout Old City', null, 'Vieux Nice, 25 Rue de la Croix, 06300 Nice, France', 43.6970269, 7.2774637, null, null, null, null, null, null, '2026-02-22 15:58:13.779992+00'),
-- Paris trip activities  
('949815ed-599b-40a0-824c-bd286cf8f5ab', 'c3d9ae8a-b70d-48ad-9f80-877b229fac46', null, null, 'Tour Eiffel', 'Go to the top', 'Eiffel Tower, Av. Gustave Eiffel, 75007 Paris, France', 48.85837009999999, 2.2944813, 'ChIJd8fbQyL9kRq8ZwTJCGu', '10:00:00', '12:00:00', 35.00, 'EUR', 'Skip-the-line tickets recommended, best views from second floor', '2026-02-22 18:30:20.316613+00');
