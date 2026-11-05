# Sertão de Fé

Portal público das capelas de Triunfo-PE (catálogo, mapa afetivo, fichas e área da equipe).

## Estrutura
- `public/index.html` — site (versão v3 do protótipo)
- `public/Mapa Afetivo.dc.html` — componente do mapa
- `public/abertura.jsx` — animação de abertura
- `public/support.js` — runtime que renderiza os componentes
- `public/img/` — fotos das capelas

## Rodar local
```
npm run dev
```
Abre em http://localhost:3000

## Deploy
Vercel, sem build (estático). `vercel.json` aponta para `public/`.

## Próximas fases
1. Supabase: tabelas de capelas, mídias e usuários da equipe; storage para fotos/áudios/vídeos.
2. Trocar os dados fixos do `index.html` por leitura do Supabase.
3. Login real na "Área da equipe".
