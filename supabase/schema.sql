create table if not exists public.projects (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 data jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "Users manage their projects" on public.projects for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
