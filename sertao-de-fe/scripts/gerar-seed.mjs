// Gera supabase/seed.sql a partir dos dados fixos do protótipo em public/index.html.
// Uso: npm run db:gerar-seed
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const html = readFileSync(new URL('public/index.html', root), 'utf8');
const start = html.indexOf('const ZONES = {');
const end = html.indexOf('const DB = window.sfData;');
if (start < 0 || end < 0) throw new Error('Dados do protótipo não encontrados em index.html');
const chapels = vm.runInNewContext(html.slice(start, end) + '\nbuildChapels();');

const lit = v => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return "'" + String(v).replaceAll("'", "''") + "'";
};
// Id estável por capela e posição: rodar o seed de novo não duplica mídias.
const stableUuid = key => {
  const h = createHash('md5').update(key).digest('hex');
  return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20, 32)].join('-');
};
const insert = (table, cols, rows) => 'insert into public.' + table + ' (' + cols.join(', ') + ') values\n' +
  rows.map(r => '  (' + r.map(lit).join(', ') + ')').join(',\n') + '\non conflict (id) do nothing;\n';

const chapelCols = ['id', 'num', 'slug', 'name', 'padroeiro', 'zona', 'localidade', 'ano', 'festa', 'estilo', 'conservacao', 'guardiao', 'lat', 'lng', 'historia', 'citacao', 'transcricao', 'destaque', 'status'];
const mediaRows = chapels.flatMap(c => c.media.map((m, i) => [stableUuid(c.slug + ':' + i), c.id, m.type, m.url, m.caption, m.alt, m.credit, m.cover, i]));

const VOZES = { 11: 50, 3: 37, 19: 70 };
const guardianRows = chapels.filter(c => c.guardiao).map(c => [stableUuid('guardiao:' + c.slug), c.id, c.guardiao, c.citacao, c.transcricao, VOZES[c.id] ? 'img/c' + VOZES[c.id] + '.jpg' : null, !!VOZES[c.id], c.status]);

const sql = '-- Gerado por scripts/gerar-seed.mjs. Não edite à mão.\n\n' +
  insert('capelas', chapelCols, chapels.map(c => chapelCols.map(k => c[k]))) + '\n' +
  insert('midias', ['id', 'capela_id', 'type', 'url', 'caption', 'alt', 'credit', 'cover', 'position'], mediaRows) + '\n' +
  insert('guardioes', ['id', 'capela_id', 'nome', 'citacao', 'transcricao', 'foto_url', 'destaque', 'status'], guardianRows) + '\n' +
  "select setval(pg_get_serial_sequence('public.capelas', 'id'), (select max(id) from public.capelas));\n";

writeFileSync(new URL('supabase/seed.sql', root), sql);
console.log(chapels.length + ' capelas e ' + mediaRows.length + ' mídias em supabase/seed.sql');
