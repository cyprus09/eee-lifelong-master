-- Insert sample events
INSERT INTO events (
    id,
    title,
    description,
    event_date,
    venue,
    max_attendees,
    current_attendees,
    event_type,
    created_by,
    created_at,
    updated_at
) VALUES 
(
    uuid_generate_v4(),
    'EEE Alumni Networking Night',
    'Join us for an evening of networking with successful EEE alumni from various industries. Light refreshments will be provided.',
    (CURRENT_DATE + INTERVAL '7 days' + INTERVAL '18 hours'),
    'EEE Auditorium',
    50,
    12,
    'Social',
    '87e3d647-15c2-4f6b-a27d-7acd3b687fcc', -- your student_leader user ID
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'Technical Workshop: IoT Development',
    'Hands-on workshop on IoT development using Arduino and Raspberry Pi. Bring your own laptop.',
    (CURRENT_DATE + INTERVAL '14 days' + INTERVAL '14 hours'),
    'EEE Lab 3',
    30,
    25,
    'Academic',
    '87e3d647-15c2-4f6b-a27d-7acd3b687fcc',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'Career Fair 2024',
    'Annual EEE career fair featuring top companies in electronics, semiconductors, and technology sectors.',
    (CURRENT_DATE + INTERVAL '21 days' + INTERVAL '10 hours'),
    'School of EEE Main Hall',
    200,
    150,
    'Career',
    '87e3d647-15c2-4f6b-a27d-7acd3b687fcc',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'EEE Cultural Night',
    'Annual cultural celebration featuring performances by EEE students and alumni.',
    (CURRENT_DATE + INTERVAL '30 days' + INTERVAL '19 hours'),
    'University Cultural Centre',
    300,
    45,
    'Cultural',
    '87e3d647-15c2-4f6b-a27d-7acd3b687fcc',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'Research Symposium 2024',
    'Showcase of final year projects and research work by EEE students.',
    (CURRENT_DATE - INTERVAL '5 days' + INTERVAL '9 hours'),
    'Research Techno Plaza',
    150,
    120,
    'Academic',
    '87e3d647-15c2-4f6b-a27d-7acd3b687fcc',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
),
(
    uuid_generate_v4(),
    'Industry Talk: Future of AI',
    'Distinguished lecture on the future of AI in electrical engineering by industry experts.',
    (CURRENT_DATE + INTERVAL '45 days' + INTERVAL '15 hours'),
    'Lecture Theatre 1',
    100,
    0,
    'Career',
    '87e3d647-15c2-4f6b-a27d-7acd3b687fcc',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert some past registrations
INSERT INTO event_registrations (
    id,
    event_id,
    user_id,
    registration_date
)
SELECT 
    uuid_generate_v4(),
    e.id,
    '87e3d647-15c2-4f6b-a27d-7acd3b687fcc',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM events e
LIMIT 2;