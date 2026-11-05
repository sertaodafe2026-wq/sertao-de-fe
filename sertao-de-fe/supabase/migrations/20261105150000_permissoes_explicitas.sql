-- Projetos novos podem vir com permissões padrão amplas para anon e authenticated,
-- inclusive TRUNCATE, que não passa pelo RLS. Aqui as permissões ficam explícitas,
-- sem depender do padrão de cada projeto.
revoke all on public.equipe, public.capelas, public.midias, public.atividades from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on function public.is_equipe(), public.touch_updated_at() from public, anon, authenticated;

grant select on public.capelas, public.midias to anon, authenticated;
grant insert, update on public.capelas, public.midias to authenticated;
grant select on public.equipe to authenticated;
grant select, insert on public.atividades to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on function public.is_equipe() to anon, authenticated;
