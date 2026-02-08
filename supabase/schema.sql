-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- STREAMS Table
create table public.streams (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  category text,
  is_public boolean default true,
  likes_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STREAM ITEMS Table
create table public.stream_items (
  id uuid default uuid_generate_v4() primary key,
  stream_id uuid references public.streams(id) on delete cascade not null,
  title text not null,
  recurrence_rule jsonb, -- Stores the JSON structure of RecurrenceConfig
  day_offset int default 0, -- 0 = start immediately/today, 1 = tomorrow, etc.
  time_of_day text, -- "08:00"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUBSCRIPTIONS Table (Users following streams)
create table public.stream_subscriptions (
  user_id uuid references auth.users(id) not null,
  stream_id uuid references public.streams(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, stream_id)
);

-- RLS POLICIES

-- Streams: Everyone can read public streams. Creators can update their own.
alter table public.streams enable row level security;

create policy "Public streams are viewable by everyone"
  on public.streams for select
  using (is_public = true or auth.uid() = creator_id);

create policy "Users can insert their own streams"
  on public.streams for insert
  with check (auth.uid() = creator_id);

create policy "Users can update their own streams"
  on public.streams for update
  using (auth.uid() = creator_id);

-- Stream Items: Inherit visibility from stream
alter table public.stream_items enable row level security;

create policy "Stream items are viewable if stream is viewable"
  on public.stream_items for select
  using (
    exists (
      select 1 from public.streams
      where streams.id = stream_items.stream_id
      and (streams.is_public = true or streams.creator_id = auth.uid())
    )
  );

create policy "Creators can manage items"
  on public.stream_items for all
  using (
    exists (
      select 1 from public.streams
      where streams.id = stream_items.stream_id
      and streams.creator_id = auth.uid()
    )
  );

-- Subscriptions: Users manage their own
alter table public.stream_subscriptions enable row level security;

create policy "Users manage their own subscriptions"
  on public.stream_subscriptions for all
  using (auth.uid() = user_id);

-- Adaptive Snooze
alter table public.reminders add column if not exists snooze_count integer default 0;
