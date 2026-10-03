-- Run against any Postgres instance (local Docker for dev, Neon/Vercel Postgres for prod):
--   psql "$DATABASE_URL" -f db/schema.sql
-- No psql installed? Use the Node fallback instead (reads the URL from a file,
-- never from argv, so it won't leak into shell history or `ps`):
--   echo "$DATABASE_URL" > /tmp/db_url.txt && node scripts/run-sql-file.mjs /tmp/db_url.txt db/schema.sql

create extension if not exists pgcrypto;

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  title text not null default '',
  firm text not null default '',
  focus text[] not null default '{}',
  location text not null default '',
  status text not null default 'active' check (status in ('active', 'deactivated')),
  created_at timestamptz not null default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  firm text not null,
  jurisdiction text not null,
  link text not null default '',
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- Application form v2: new applicant fields, bar admission retired, and a
-- record of when the applicant accepted the site policies. Safe to re-run.
alter table applications add column if not exists job_title text not null default '';
alter table applications add column if not exists industry text not null default '';
alter table applications add column if not exists city text not null default '';
alter table applications add column if not exists state text not null default '';
alter table applications add column if not exists country text not null default '';
alter table applications add column if not exists policies_accepted_at timestamptz;
alter table applications alter column jurisdiction set default '';

-- Editable approval/rejection email copy. Supports {{first_name}}, {{name}} and {{firm}}
-- placeholders, rendered at send time.
create table if not exists email_templates (
  key text primary key check (key in ('approval', 'rejection')),
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

-- Ad-hoc admin-composed emails (broadcasts, individual notes, event
-- invites/reminders) — kept as a log so admins can see what's already gone
-- out and to whom, not as a queue (sending happens synchronously).
create table if not exists email_broadcasts (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  audience text not null, -- e.g. "All active members", "jane@firm.com", "Event invite: <title>"
  recipient_count integer not null default 0,
  sent_by text not null,
  sent_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text not null default '',
  event_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  response text not null default 'pending' check (response in ('pending', 'yes', 'no')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, member_id)
);

-- For CSV bulk-import: members previously only captured a fraction of what
-- the application form asks. Add the rest so an imported profile can be as
-- complete as one that came through an approved application.
alter table members add column if not exists industry text not null default '';
alter table members add column if not exists link text not null default '';
alter table members add column if not exists bio text not null default '';

-- First and last names stored separately (the application form collects
-- them separately; emails can greet by {{first_name}}). `name` stays as the
-- full name used for display. Existing rows are backfilled by splitting
-- `name` at the first space. Safe to re-run.
alter table applications add column if not exists first_name text not null default '';
alter table applications add column if not exists last_name text not null default '';
alter table members add column if not exists first_name text not null default '';
alter table members add column if not exists last_name text not null default '';
update applications
set first_name = split_part(trim(name), ' ', 1),
    last_name = trim(substr(trim(name), length(split_part(trim(name), ' ', 1)) + 1))
where first_name = '' and last_name = '';
update members
set first_name = split_part(trim(name), ' ', 1),
    last_name = trim(substr(trim(name), length(split_part(trim(name), ' ', 1)) + 1))
where first_name = '' and last_name = '';

-- Member passwords (email login links remain as a backup) and an optional
-- personal backup email members can log in with or receive links at.
-- Safe to re-run.
alter table members add column if not exists password_hash text;
alter table members add column if not exists backup_email text not null default '';

-- Members can opt out of appearing in the members-only directory. They still
-- receive member emails and stay visible to admins. Safe to re-run.
alter table members add column if not exists hide_from_directory boolean not null default false;
