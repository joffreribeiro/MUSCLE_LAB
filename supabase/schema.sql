-- Muscle Lab: tabela que guarda a cópia dos dados de cada conta.
-- Rode este arquivo UMA vez no seu projeto Supabase (menu "SQL Editor" -> "New query" -> colar -> "Run").

create table if not exists public.backups (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Cada pessoa só enxerga e altera a própria linha.
alter table public.backups enable row level security;

drop policy if exists "ler o proprio backup" on public.backups;
create policy "ler o proprio backup" on public.backups
  for select using (auth.uid() = user_id);

drop policy if exists "criar o proprio backup" on public.backups;
create policy "criar o proprio backup" on public.backups
  for insert with check (auth.uid() = user_id);

drop policy if exists "atualizar o proprio backup" on public.backups;
create policy "atualizar o proprio backup" on public.backups
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "apagar o proprio backup" on public.backups;
create policy "apagar o proprio backup" on public.backups
  for delete using (auth.uid() = user_id);

-- A hora de modificação vem sempre do servidor (o app só a compara, nunca a define).
create or replace function public.backups_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists backups_touch on public.backups;
create trigger backups_touch before insert or update on public.backups
  for each row execute function public.backups_touch();
