-- Classifica e salvataggio online per GengisBall (Supabase, piano gratuito).
-- Incolla questo file in Supabase -> SQL Editor -> Run.

create table if not exists players (
  id uuid primary key,
  name text not null check (char_length(name) between 2 and 12),
  tbest int not null default 0,   -- record modalità a tempo (livelli completati)
  sbest int not null default 0,   -- record survival (livello raggiunto)
  data jsonb,                     -- backup dei progressi (stelle, skin...)
  updated_at timestamptz not null default now()
);

-- Nessun accesso diretto alla tabella: tutto passa da funzioni e da una vista pubblica.
alter table players enable row level security;

create or replace function save_player(pid uuid, pname text, pt int, ps int, pdata jsonb)
returns void language sql security definer set search_path = public as $$
  insert into players(id, name, tbest, sbest, data)
  values (pid, left(trim(pname), 12), greatest(pt,0), greatest(ps,0), pdata)
  on conflict (id) do update set
    name = excluded.name,
    tbest = greatest(players.tbest, excluded.tbest),
    sbest = greatest(players.sbest, excluded.sbest),
    data = excluded.data,
    updated_at = now();
$$;

create or replace function get_player(pid uuid)
returns json language sql security definer set search_path = public as $$
  select row_to_json(p) from players p where p.id = pid;
$$;

-- Vista pubblica per la classifica: espone solo nome e record, mai l'id.
create or replace view leaderboard as select name, tbest, sbest from players;

grant select on leaderboard to anon;
grant execute on function save_player(uuid, text, int, int, jsonb) to anon;
grant execute on function get_player(uuid) to anon;
