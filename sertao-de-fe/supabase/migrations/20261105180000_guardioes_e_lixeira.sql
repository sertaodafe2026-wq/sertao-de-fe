-- Guardiões e depoimentos em tabela própria, status "Arquivado" e lixeira de capelas.
-- As colunas guardiao, citacao e transcricao de capelas deixam de ser usadas pelo site.

alter table public.capelas drop constraint capelas_status_check;
alter table public.capelas add constraint capelas_status_check
  check (status in ('Rascunho', 'Em revisão', 'Publicado', 'Arquivado'));
alter table public.capelas add column removed_at timestamptz;

-- Cada registro é uma pessoa com um depoimento. removed_at funciona como lixeira.
create table public.guardioes (
  id uuid primary key default gen_random_uuid(),
  capela_id bigint references public.capelas (id) on delete set null,
  nome text not null,
  papel text not null default '',
  foto_url text,
  foto_path text,
  citacao text not null default '',
  transcricao text not null default '',
  audio_url text,
  audio_path text,
  autorizacao boolean not null default false,
  destaque boolean not null default false,
  status text not null default 'Rascunho' check (status in ('Rascunho', 'Em revisão', 'Publicado', 'Arquivado')),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index guardioes_capela_id_idx on public.guardioes (capela_id);

create trigger guardioes_touch_updated_at
  before update on public.guardioes
  for each row execute function public.touch_updated_at();

-- Id derivado do slug: o seed usa o mesmo cálculo e não duplica estes registros.
insert into public.guardioes (id, capela_id, nome, citacao, transcricao, foto_url, destaque, status)
select
  md5('guardiao:' || slug)::uuid, id, guardiao, citacao, transcricao,
  case id when 11 then 'img/c50.jpg' when 3 then 'img/c37.jpg' when 19 then 'img/c70.jpg' end,
  id in (11, 3, 19), status
from public.capelas
where guardiao <> '';

revoke all on public.guardioes from anon, authenticated;
grant select on public.guardioes to anon, authenticated;
grant insert, update on public.guardioes to authenticated;

alter table public.guardioes enable row level security;

create policy "público lê guardiões publicados" on public.guardioes
  for select to anon, authenticated
  using (
    status = 'Publicado'
    and removed_at is null
    and (
      capela_id is null
      or exists (
        select 1 from public.capelas c
        where c.id = capela_id and c.status = 'Publicado' and c.removed_at is null
      )
    )
  );

create policy "equipe lê todos os guardiões" on public.guardioes
  for select to authenticated
  using (public.is_equipe());

create policy "equipe cria guardiões" on public.guardioes
  for insert to authenticated
  with check (public.is_equipe());

create policy "equipe edita guardiões" on public.guardioes
  for update to authenticated
  using (public.is_equipe())
  with check (public.is_equipe());

-- Capelas na lixeira saem do site, com as mídias.
drop policy "público lê capelas publicadas" on public.capelas;
create policy "público lê capelas publicadas" on public.capelas
  for select to anon, authenticated
  using (status = 'Publicado' and removed_at is null);

drop policy "público lê mídias de capelas publicadas" on public.midias;
create policy "público lê mídias de capelas publicadas" on public.midias
  for select to anon, authenticated
  using (
    removed_at is null
    and exists (
      select 1 from public.capelas c
      where c.id = capela_id and c.status = 'Publicado' and c.removed_at is null
    )
  );
