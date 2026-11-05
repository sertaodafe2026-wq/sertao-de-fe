# Sertão de Fé

Portal público das capelas de Triunfo-PE (catálogo, mapa afetivo, fichas e área da equipe).

## Estrutura
- `public/index.html` — site (versão v3 do protótipo)
- `public/Mapa Afetivo.dc.html` — componente do mapa
- `public/abertura.jsx` — animação de abertura
- `public/support.js` — runtime que renderiza os componentes
- `public/img/` — fotos das capelas
- `public/supabase-config.js` — URL e chave publicável do Supabase
- `public/sf-data.js` — leitura, escrita, login e envio de arquivos
- `supabase/migrations/` — tabelas e regras de acesso
- `supabase/seed.sql` — carga inicial, gerada por `npm run db:gerar-seed`

## Rodar local
```
npm run dev
```
Abre em http://localhost:3000

## Deploy
Vercel, sem build (estático). `vercel.json` aponta para `public/`.

## Supabase
Com `public/supabase-config.js` vazio, o site roda em modo protótipo: dados fixos e nada é salvo.
Com ele preenchido, tudo vem do Supabase, e um erro de conexão mostra um aviso em vez dos dados fixos.

Para ligar um projeto novo:
```
supabase link --project-ref SEU_PROJECT_REF
supabase db push --include-seed
supabase config push
```
`config push` envia também as URLs de `supabase/config.toml`, então ajuste `site_url` para o domínio de produção antes.

Depois, preencha `public/supabase-config.js` e crie cada pessoa da equipe em
**Authentication > Users**. Uma conta só edita depois de entrar na tabela `equipe`:
```sql
insert into public.equipe (user_id, nome)
select id, 'Ana' from auth.users where email = 'ana@exemplo.org';
```

Arquivos removidos no painel vão para a lixeira (`midias.removed_at`): continuam no banco e no Storage.
