// Berkas pembaruan aplikasi: hanya diberikan kepada aplikasi yang sudah terpasang (membawa kunci). Selain itu: 404, seolah tidak ada.
const KEY = '__DL_KEY__', DIR = '__DL_DIR__';
const LEGACY = true; // versi lama (sebelum kunci) mengenali dirinya lewat Dart/; matikan setelah semua pengguna memperbarui
module.exports = (req, res) => {
  const f = String(req.query.f || '');
  const ua = String(req.headers['user-agent'] || '');
  const ok = (req.headers['x-hulhup-key'] === KEY && KEY.length > 8) || (LEGACY && ua.startsWith('Dart/'));
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!ok || (f !== 'hulhup.apk' && f !== 'version.json')) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('Not found'); }
  res.statusCode = 302;
  res.setHeader('Location', '/_f/' + DIR + '/' + f);
  res.end();
};
