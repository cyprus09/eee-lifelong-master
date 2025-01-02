-- Create an enum for user roles
create type user_role as enum ('user', 'student_leader', 'admin');

-- Create a profiles table
create table profiles (
    id uuid references auth.users on delete cascade not null primary key,
    role user_role default 'user',
    updated_at timestamp with time zone,
    username text unique,
    batch_year int,
    constraint username_length check (char_length(username) >= 3)
);

-- Create events table
create table events (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    event_date timestamp with time zone not null,
    venue text,
    max_attendees int,
    current_attendees int default 0,
    event_type text not null,
    created_by uuid references auth.users not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create registrations table
create table event_registrations (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references events on delete cascade,
    user_id uuid references auth.users on delete cascade,
    registration_date timestamp with time zone default now(),
    unique(event_id, user_id)
);

-- Function to automatically create profile after signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
    insert into public.profiles (id, role, username)
    values (new.id, 'user', new.email);
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile after signup
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- RLS Policies
alter table profiles enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
    on profiles for select
    using ( true );

create policy "Users can update own profile"
    on profiles for update
    using ( auth.uid() = id );

-- Events policies
create policy "Events are viewable by everyone"
    on events for select
    using ( true );

create policy "Only student leaders can create events"
    on events for insert
    with check ( 
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role = 'student_leader'
        )
    );

-- Event registrations policies
create policy "Users can view their own registrations"
    on event_registrations for select
    using ( auth.uid() = user_id );

create policy "Users can register for events"
    on event_registrations for insert
    with check ( auth.uid() = user_id );