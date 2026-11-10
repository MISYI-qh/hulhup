// Menyajikan index.html aplikasi dengan <head> khusus per halaman (judul, deskripsi, canonical, robots) agar tiap alamat unik bagi mesin pencari.
const fs = require('fs');
const path = require('path');
const API = 'https://hulhup-api.vercel.app';
const ORIGIN = 'https://hulhup.my.id';
let tpl = null;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const PRIVATE = new Set(['settings', 'notifications', 'login', 'recover', 'new', 'sent', 'me', 'offline', 'search', 'streak', 'get-app']);
const NAMES = { settings: 'Pengaturan', notifications: 'Notifikasi', login: 'Masuk', recover: 'Lupa kata sandi', new: 'Buat post', sent: 'Terkirim', me: 'Profilku', offline: 'Audio offline', search: 'Cari', streak: 'Streak', 'get-app': 'Unduh aplikasi Android', account: 'Akun', language: 'Bahasa', appearance: 'Tampilan', notifications2: 'Notifikasi', security: 'Keamanan', password: 'Ganti kata sandi', profile: 'Ubah profil', sessions: 'Perangkat masuk', sorot: 'Sorot', saved: 'Disimpan' };
const STATIC = {
  hups: ['Hups — tulisan dan suara di Hulhup', 'Hups adalah linimasa tulisan Hulhup dengan audio opsional, komentar, dan balasan.'],
  faq: ['FAQ — Hulhup', 'Pertanyaan yang sering diajukan tentang Hulhup: Acak, Hups, backsound, tag, privasi, dan lupa sandi.'],
  about: ['Tentang Hulhup', 'Hulhup adalah rumah sederhana untuk suara dan tulisan, produk Misyi.'],
  policy: ['Ketentuan — Hulhup', 'Aturan penggunaan Hulhup.'],
  privacy: ['Privasi — Hulhup', 'Kebijakan privasi Hulhup.'],
};
async function j(p) {
  try { const r = await fetch(API + p, { headers: { accept: 'application/json' } }); return r.ok ? await r.json() : null; } catch { return null; }
}
module.exports = async (req, res) => {
  if (!tpl) tpl = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const u = new URL(req.url, ORIGIN);
  const raw = u.searchParams.get('p') || '/';
  const seg = raw.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
  let title = null, desc = null, canon = '/', robots = 'index, follow, max-image-preview:large', status = 200;
  const k = seg[0] || '';
  if (k === 'p' && /^\d+$/.test(seg[1] || '')) {
    const d = await j('/posts/' + seg[1]);
    if (d && d.post) {
      const t = clip(d.text || d.post.desc || '', 160);
      title = `${d.post.owner_name}${t ? ': ' + clip(t, 60) : ''} · Hulhup`;
      desc = t || `Post oleh ${d.post.owner_name} di Hulhup.`;
      canon = '/p/' + seg[1];
    } else { robots = 'noindex, nofollow'; canon = '/p/' + seg[1]; title = 'Post tidak tersedia — Hulhup'; }
  } else if (k === 'u' && seg[1]) {
    canon = '/' + seg.map(encodeURIComponent).join('/');
    if (seg.length > 2) { robots = 'noindex, follow'; title = `${seg[2]} · @${seg[1]} · Hulhup`; }
    else {
      const d = await j('/users/' + encodeURIComponent(seg[1]));
      const x = d && (d.user || d);
      if (x && x.name) { title = `${x.name} (@${seg[1]}) · Hulhup`; desc = clip(x.bio || `Profil ${x.name} di Hulhup.`, 160); }
      else { robots = 'noindex, nofollow'; title = 'Akun tidak ditemukan — Hulhup'; }
    }
  } else if (STATIC[k]) { [title, desc] = STATIC[k]; canon = '/' + k; }
  else if (PRIVATE.has(k)) {
    robots = 'noindex, nofollow'; canon = '/' + seg.map(encodeURIComponent).join('/');
    title = [seg.map((x) => NAMES[x] || x).reverse().join(' · '), 'Hulhup'].join(' · ');
  }
  else if (k === 'acak' || k === '') { canon = '/'; }
  else { robots = 'noindex, nofollow'; status = 404; title = 'Halaman tidak ditemukan — Hulhup'; }
  let h = tpl;
  const url = ORIGIN + (canon === '/' ? '/' : canon);
  if (title) {
    h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(title)}"`)
      .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${esc(title)}"`);
  }
  if (desc) {
    h = h.replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(desc)}"`)
      .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(desc)}"`)
      .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(desc)}"`);
  }
  h = h.replace(/(<link rel="canonical" href=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta name="robots" content=")[^"]*"/, `$1${robots}"`);
  res.statusCode = status;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', status === 200 ? 'public, s-maxage=300, stale-while-revalidate=3600' : 'public, s-maxage=60');
  res.end(h);
};
