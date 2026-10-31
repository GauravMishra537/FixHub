-- V16: starting catalog. 10 kinds, 56 units. Admin console edits this later (add, edit, switch off).
-- Safe to re-run: a row is added only when its name is not there yet.

INSERT INTO infra_type (name, description, icon, max_minutes, sort_order, created_on, updated_on)
SELECT v.name, v.description, v.icon, v.max_minutes, v.sort_order, now(), now()
FROM (VALUES
    ('Conference Room',  'Team and client meetings',          'conference', 240, 1),
    ('Training Room',    'Classroom style sessions',          'training',   480, 2),
    ('Computer Lab',     'Workstations for hands-on work',    'lab',        240, 3),
    ('Device Test Lab',  'Phones and devices for testing',    'device',     240, 4),
    ('Gym Area',         'Fitness and wellness area',         'gym',        120, 5),
    ('Game Room',        'Indoor games and breaks',           'game',       120, 6),
    ('Phone Booth',      'Quiet space for calls',             'phone',       60, 7),
    ('Interview Room',   'Hiring interviews',                 'interview',  120, 8),
    ('Brainstorm Zone',  'Open space with boards',            'brainstorm', 180, 9),
    ('Event Hall',       'Large events and all hands',        'hall',       480, 10)
) AS v(name, description, icon, max_minutes, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM infra_type t
    WHERE lower(t.name) = lower(v.name) AND t.deleted_on IS NULL
);

INSERT INTO infrastructure (infra_type_id, name, capacity, location, status, created_on, updated_on)
SELECT t.id, v.unit_name, v.capacity, v.location, 'ACTIVE', now(), now()
FROM (VALUES
    -- Conference Room: 5
    ('Conference Room', 'Conference Room 1',  4, 'Floor 1'),
    ('Conference Room', 'Conference Room 2',  4, 'Floor 1'),
    ('Conference Room', 'Conference Room 3',  6, 'Floor 1'),
    ('Conference Room', 'Conference Room 4',  8, 'Floor 2'),
    ('Conference Room', 'Conference Room 5', 10, 'Floor 2'),
    -- Training Room: 5
    ('Training Room', 'Training Room 1', 15, 'Floor 2'),
    ('Training Room', 'Training Room 2', 20, 'Floor 2'),
    ('Training Room', 'Training Room 3', 25, 'Floor 3'),
    ('Training Room', 'Training Room 4', 30, 'Floor 3'),
    ('Training Room', 'Training Room 5', 40, 'Floor 3'),
    -- Computer Lab: 6
    ('Computer Lab', 'Computer Lab 1', 10, 'Floor 3'),
    ('Computer Lab', 'Computer Lab 2', 12, 'Floor 3'),
    ('Computer Lab', 'Computer Lab 3', 15, 'Floor 3'),
    ('Computer Lab', 'Computer Lab 4', 20, 'Floor 4'),
    ('Computer Lab', 'Computer Lab 5', 25, 'Floor 4'),
    ('Computer Lab', 'Computer Lab 6', 30, 'Floor 4'),
    -- Device Test Lab: 5
    ('Device Test Lab', 'Device Test Lab 1',  4, 'Floor 4'),
    ('Device Test Lab', 'Device Test Lab 2',  6, 'Floor 4'),
    ('Device Test Lab', 'Device Test Lab 3',  8, 'Floor 4'),
    ('Device Test Lab', 'Device Test Lab 4', 10, 'Floor 4'),
    ('Device Test Lab', 'Device Test Lab 5', 12, 'Floor 4'),
    -- Gym Area: 5
    ('Gym Area', 'Gym Area 1',  5, 'Ground'),
    ('Gym Area', 'Gym Area 2',  8, 'Ground'),
    ('Gym Area', 'Gym Area 3', 10, 'Ground'),
    ('Gym Area', 'Gym Area 4', 15, 'Ground'),
    ('Gym Area', 'Gym Area 5', 20, 'Ground'),
    -- Game Room: 5
    ('Game Room', 'Game Room 1',  4, 'Ground'),
    ('Game Room', 'Game Room 2',  6, 'Ground'),
    ('Game Room', 'Game Room 3',  8, 'Ground'),
    ('Game Room', 'Game Room 4', 10, 'Ground'),
    ('Game Room', 'Game Room 5', 15, 'Ground'),
    -- Phone Booth: 8
    ('Phone Booth', 'Phone Booth 1', 1, 'Floor 1'),
    ('Phone Booth', 'Phone Booth 2', 1, 'Floor 1'),
    ('Phone Booth', 'Phone Booth 3', 1, 'Floor 2'),
    ('Phone Booth', 'Phone Booth 4', 1, 'Floor 2'),
    ('Phone Booth', 'Phone Booth 5', 2, 'Floor 3'),
    ('Phone Booth', 'Phone Booth 6', 2, 'Floor 3'),
    ('Phone Booth', 'Phone Booth 7', 2, 'Floor 4'),
    ('Phone Booth', 'Phone Booth 8', 2, 'Floor 4'),
    -- Interview Room: 6
    ('Interview Room', 'Interview Room 1', 2, 'Floor 1'),
    ('Interview Room', 'Interview Room 2', 2, 'Floor 1'),
    ('Interview Room', 'Interview Room 3', 3, 'Floor 1'),
    ('Interview Room', 'Interview Room 4', 3, 'Floor 2'),
    ('Interview Room', 'Interview Room 5', 4, 'Floor 2'),
    ('Interview Room', 'Interview Room 6', 4, 'Floor 2'),
    -- Brainstorm Zone: 6
    ('Brainstorm Zone', 'Brainstorm Zone 1',  4, 'Floor 2'),
    ('Brainstorm Zone', 'Brainstorm Zone 2',  6, 'Floor 2'),
    ('Brainstorm Zone', 'Brainstorm Zone 3',  6, 'Floor 3'),
    ('Brainstorm Zone', 'Brainstorm Zone 4',  8, 'Floor 3'),
    ('Brainstorm Zone', 'Brainstorm Zone 5', 10, 'Floor 4'),
    ('Brainstorm Zone', 'Brainstorm Zone 6', 12, 'Floor 4'),
    -- Event Hall: 5
    ('Event Hall', 'Event Hall 1',  50, 'Ground'),
    ('Event Hall', 'Event Hall 2',  60, 'Ground'),
    ('Event Hall', 'Event Hall 3',  80, 'Ground'),
    ('Event Hall', 'Event Hall 4', 100, 'Ground'),
    ('Event Hall', 'Event Hall 5', 120, 'Ground')
) AS v(type_name, unit_name, capacity, location)
JOIN infra_type t ON lower(t.name) = lower(v.type_name) AND t.deleted_on IS NULL
WHERE NOT EXISTS (
    SELECT 1 FROM infrastructure i
    WHERE i.infra_type_id = t.id
      AND lower(i.name) = lower(v.unit_name)
      AND i.deleted_on IS NULL
);