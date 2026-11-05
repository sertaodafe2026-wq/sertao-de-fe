// Acesso ao Supabase usado por index.html.
(function () {
  const cfg = window.SF_SUPABASE || {};
  const configured = !!(cfg.url && cfg.publishableKey);
  const BUCKET = 'midias';
  const CHAPEL_FIELDS = ['num', 'slug', 'name', 'padroeiro', 'zona', 'localidade', 'ano', 'festa', 'estilo', 'conservacao', 'lat', 'lng', 'historia', 'destaque', 'status', 'removed_at'];
  const GUARDIAN_FIELDS = ['capela_id', 'nome', 'papel', 'foto_url', 'foto_path', 'citacao', 'transcricao', 'audio_url', 'audio_path', 'autorizacao', 'destaque', 'status', 'removed_at'];
  const pick = (o, keys) => Object.fromEntries(keys.map(k => [k, o[k]]));

  let client = null;
  function sb() {
    if (client) return client;
    if (!window.supabase) throw new Error('a biblioteca do Supabase não carregou');
    client = window.supabase.createClient(cfg.url, cfg.publishableKey);
    return client;
  }
  function must({ data, error }) {
    if (error) throw new Error(error.message);
    return data;
  }

  const toMedia = m => ({
    id: m.id, type: m.type, url: m.url, storage_path: m.storage_path, caption: m.caption, alt: m.alt,
    credit: m.credit, cover: m.cover, embed: m.embed
  });
  const toChapel = r => ({
    ...pick(r, CHAPEL_FIELDS), id: r.id, updated_at: r.updated_at,
    media: (r.midias || []).filter(m => !m.removed_at).map(toMedia)
  });

  async function loadChapels() {
    const rows = must(await sb().from('capelas').select('*, midias(*)').order('num').order('position', { referencedTable: 'midias' }));
    return rows.map(toChapel);
  }

  const toGuardian = r => ({ ...pick(r, GUARDIAN_FIELDS), id: r.id, updated_at: r.updated_at });

  async function loadGuardians() {
    return must(await sb().from('guardioes').select('*').order('nome')).map(toGuardian);
  }

  async function createGuardian(fields) {
    return toGuardian(must(await sb().from('guardioes').insert(fields).select().single()));
  }

  async function saveGuardian(g) {
    const updated = must(await sb().from('guardioes').update(pick(g, GUARDIAN_FIELDS)).eq('id', g.id).select('id'));
    if (!updated.length) throw new Error('sem permissão para editar este registro');
  }

  async function loadLog() {
    const rows = must(await sb().from('atividades').select('*').order('created_at', { ascending: false }).limit(30));
    return rows.map(l => ({ who: l.who, what: l.what, t: Date.parse(l.created_at), cid: l.capela_id }));
  }

  async function addLog(who, what, cid) {
    must(await sb().from('atividades').insert({ who, what, capela_id: cid }));
  }

  async function memberFor(user) {
    return must(await sb().from('equipe').select('nome').eq('user_id', user.id).maybeSingle());
  }

  // Retorna { nome } se há sessão de alguém da equipe; caso contrário, null.
  async function currentMember() {
    const { session } = must(await sb().auth.getSession());
    return session ? memberFor(session.user) : null;
  }

  async function signIn(email, password) {
    const { data, error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.code === 'invalid_credentials' ? 'E-mail ou senha incorretos.' : error.message);
    const member = await memberFor(data.user);
    if (!member) {
      await sb().auth.signOut();
      throw new Error('Esta conta não faz parte da equipe.');
    }
    return member;
  }

  async function signOut() {
    must(await sb().auth.signOut());
  }

  async function createChapel(fields) {
    return toChapel({ ...must(await sb().from('capelas').insert(fields).select().single()), midias: [] });
  }

  // Salva a capela e suas mídias. Pode ser repetido sem efeito colateral se falhar no meio.
  async function saveChapel(c) {
    // Sem permissão, o RLS não dá erro: apenas nenhuma linha é alterada.
    const updated = must(await sb().from('capelas').update(pick(c, CHAPEL_FIELDS)).eq('id', c.id).select('id'));
    if (!updated.length) throw new Error('sem permissão para editar esta capela');
    if (c.media.length) {
      const rows = c.media.map((m, position) => ({
        id: m.id, capela_id: c.id, type: m.type, url: m.url, storage_path: m.storage_path || null,
        caption: m.caption || '', alt: m.alt || '', credit: m.credit || '', cover: !!m.cover, embed: !!m.embed, position
      }));
      must(await sb().from('midias').upsert(rows));
    }
    let trash = sb().from('midias').update({ removed_at: new Date().toISOString() }).eq('capela_id', c.id).is('removed_at', null);
    if (c.media.length) trash = trash.not('id', 'in', '(' + c.media.map(m => m.id).join(',') + ')');
    must(await trash);
  }

  async function uploadFile(folder, file) {
    const ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
    const path = folder + '/' + crypto.randomUUID() + ext;
    must(await sb().storage.from(BUCKET).upload(path, file, { contentType: file.type }));
    return { url: sb().storage.from(BUCKET).getPublicUrl(path).data.publicUrl, storage_path: path };
  }

  window.sfData = { configured, loadChapels, loadGuardians, createGuardian, saveGuardian, loadLog, addLog, currentMember, signIn, signOut, createChapel, saveChapel, uploadFile };
})();
