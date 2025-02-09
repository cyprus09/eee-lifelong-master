-- Create extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('student', 'student_leader');
CREATE TYPE event_type AS ENUM ('Social', 'Academic', 'Cultural', 'Career');
CREATE TYPE room_type AS ENUM ('classroom', 'lab', 'auditorium', 'meeting_room');

-- Rooms table
CREATE TABLE rooms (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INT NOT NULL,
    room_type room_type NOT NULL,
    building TEXT NOT NULL,
    floor INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Room bookings table to track room usage
CREATE TABLE room_bookings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id uuid REFERENCES rooms(id) NOT NULL,
    event_id uuid REFERENCES events(id) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
        room_id WITH =,
        tsrange(start_time, end_time) WITH &&
    )
);

-- Create tables
CREATE TABLE profiles (
    id uuid NOT NULL PRIMARY KEY,
    role user_role DEFAULT 'student',
    updated_at TIMESTAMP WITH TIME ZONE,
    username TEXT UNIQUE,
    batch_year INT,
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO postgres;

CREATE TABLE events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue TEXT,
    max_attendees INT,
    current_attendees INT DEFAULT 0,
    event_type event_type NOT NULL,
    created_by uuid REFERENCES auth.users NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT check_max_attendees CHECK (current_attendees <= max_attendees)
);

CREATE TABLE event_registrations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id uuid REFERENCES events ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Create functions
CREATE OR REPLACE FUNCTION update_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events 
        SET current_attendees = current_attendees + 1
        WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET current_attendees = current_attendees - 1
        WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_event_attendees_trigger
    AFTER INSERT OR DELETE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_event_attendees();

CREATE TRIGGER update_events_timestamp
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING ( true );

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Enable full access to authenticated users"
    ON profiles
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Allow service role to manage all profiles
CREATE POLICY "Enable service role access"
    ON profiles
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING ( auth.uid() = id );

CREATE POLICY "Events are viewable by everyone"
    ON events FOR SELECT
    USING ( true );

CREATE POLICY "Only student leaders can create events"
    ON events FOR INSERT
    WITH CHECK ( 
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'student_leader'
        )
    );

CREATE POLICY "Student leaders can update their own events"
    ON events FOR UPDATE
    USING (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'student_leader'
        )
    );

CREATE POLICY "Student leaders can delete their own events"
    ON events FOR DELETE
    USING (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'student_leader'
        )
    );

CREATE POLICY "Users can view their own registrations"
    ON event_registrations FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can register for events"
    ON event_registrations FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can unregister from events"
    ON event_registrations FOR DELETE
    USING ( auth.uid() = user_id );

CREATE POLICY "Can only register for events with space"
    ON event_registrations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM events
            WHERE id = event_id
            AND current_attendees < max_attendees
        )
    );

-- Create indexes
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);