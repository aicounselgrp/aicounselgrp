-- Run against any Postgres instance (local Docker for dev, Neon/Vercel Postgres for prod):
--   psql "$DATABASE_URL" -f db/schema.sql

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
