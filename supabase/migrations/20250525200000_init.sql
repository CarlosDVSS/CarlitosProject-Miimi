create table if not exists sleep_status (
  person text primary key check (person in ('carlitos', 'mimi')),
  awake boolean not null default false,
  sleep_since timestamptz,
  date_key text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists sticky_notes (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('carlitos', 'mimi')),
  text text not null,
  color text not null,
  day_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists sticky_notes_day_key_idx on sticky_notes (day_key desc, created_at desc);

alter table sleep_status enable row level security;
alter table sticky_notes enable row level security;

drop policy if exists "sleep_select" on sleep_status;
drop policy if exists "sleep_insert" on sleep_status;
drop policy if exists "sleep_update" on sleep_status;
drop policy if exists "notes_select" on sticky_notes;
drop policy if exists "notes_insert" on sticky_notes;
drop policy if exists "notes_delete" on sticky_notes;

create policy "sleep_select" on sleep_status for select using (true);
create policy "sleep_insert" on sleep_status for insert with check (true);
create policy "sleep_update" on sleep_status for update using (true);

create policy "notes_select" on sticky_notes for select using (true);
create policy "notes_insert" on sticky_notes for insert with check (true);
create policy "notes_delete" on sticky_notes for delete using (true);

insert into sleep_status (person, awake, date_key) values
  ('carlitos', false, ''),
  ('mimi', false, '')
on conflict (person) do nothing;

alter publication supabase_realtime add table sleep_status;
alter publication supabase_realtime add table sticky_notes;
