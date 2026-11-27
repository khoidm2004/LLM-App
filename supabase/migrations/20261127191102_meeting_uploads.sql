-- Meeting document upload sessions, files, and generated summaries.
--
-- Access model: there is no end-user auth in this app. The Express backend
-- is the only caller, always using the service_role key (which bypasses
-- RLS). RLS is enabled with zero policies on every table below purely as
-- defense in depth: if the anon/public key were ever used against these
-- tables directly, it gets zero rows instead of whatever Supabase's default
-- public-schema grants would otherwise allow.

create table public.upload_sessions (
  id bigint generated always as identity primary key,
  session_token text not null unique,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create index upload_sessions_last_activity_at_idx
  on public.upload_sessions (last_activity_at);

alter table public.upload_sessions enable row level security;
alter table public.upload_sessions force row level security;

create table public.uploaded_files (
  id bigint generated always as identity primary key,
  session_id bigint not null references public.upload_sessions (id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index uploaded_files_session_id_idx
  on public.uploaded_files (session_id);

alter table public.uploaded_files enable row level security;
alter table public.uploaded_files force row level security;

create table public.summaries (
  id bigint generated always as identity primary key,
  session_id bigint not null references public.upload_sessions (id) on delete cascade,
  length text not null check (length in ('short', 'medium', 'detailed')),
  content text not null,
  created_at timestamptz not null default now()
);

create index summaries_session_id_idx
  on public.summaries (session_id);

alter table public.summaries enable row level security;
alter table public.summaries force row level security;

-- Private bucket for uploaded meeting documents. storage.objects already
-- has RLS enabled by default with no policies for this bucket, so it's
-- already default-deny for anon/authenticated; only the service role
-- (used exclusively by the backend) can read/write it.
insert into storage.buckets (id, name, public)
values ('meeting-documents', 'meeting-documents', false)
on conflict (id) do nothing;
