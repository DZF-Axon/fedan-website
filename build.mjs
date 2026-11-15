// Fedan website build. No dependencies.
// Usage: node build.mjs      -> writes the finished site to dist/
// Pages live in src/<lang>/*.html (a first-line comment holds slug, title, description).
// Shared parts live in src/parts. Files in static/ are copied as they are.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src'), STATIC = path.join(ROOT, 'static'), DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://fedangroup.com';
const EMAIL = 'info@fedangroup.com';
const TODAY = new Date().toISOString().slice(0, 10);

// ---- settings ---------------------------------------------------------------
// A language is "listed" once a native speaker has read it: linked from the other pages and open to Google.
const LISTED = { en: true, he: true, ru: true };
const LEGAL = 'Fedan Ltd · Company no. 17348292 · Registered office: Second Floor, Sutherland House, 70-78 West Hendon Broadway, London NW9 7BT';
const LANG = {
  en: {
    html: 'en-GB', dir: 'ltr', base: '/', og: 'en_GB', label: 'English', skip: 'Skip to content', menu: 'Menu', contact: ['/contact', 'Contact'], patch: 'North London and Surrey',
    nav: [['/owners', 'Owners'], ['/investors', 'Investors'], ['/architects', 'Architects'], ['/how-we-work', 'How we work'], ['/about', 'About']],
    foot: [
      [['/owners', 'Owners'], ['/investors', 'Investors and landlords'], ['/architects', 'Architects and designers'], ['/how-we-work', 'How we work']],
      [['/about', 'About'], ['/quote-review', 'Builder Quote Review'], ['/hampstead-office-fit-out', 'Office fit-out, Hampstead'], ['/join-the-network', 'Trades and partners']],
      [['/contact', 'Contact'], ['/privacy', 'Privacy']],
    ],
    fonts: ['family=Jost:wght@400&display=swap', 'family=Assistant:wght@400&text=%D7%A2%D7%91%D7%A8%D7%99%D7%AA&display=swap'],
  },
  he: {
    html: 'he', dir: 'rtl', base: '/he/', og: 'he_IL', label: 'עברית', skip: 'דילוג לתוכן', menu: 'תפריט', contact: ['#start', 'צרו קשר'], patch: 'צפון לונדון וסארי',
    nav: [], foot: [[['/', 'האתר המלא באנגלית'], ['/privacy', 'פרטיות']]],
    fonts: ['family=Assistant:wght@400&family=Jost:wght@400&display=swap'],
  },
  ru: {
    html: 'ru', dir: 'ltr', base: '/ru/', og: 'ru_RU', label: 'Русский', skip: 'Перейти к содержанию', menu: 'Меню', contact: ['#start', 'Связаться'], patch: 'Северный Лондон и Суррей',
    nav: [], foot: [[['/', 'Полная версия сайта на английском'], ['/privacy', 'Конфиденциальность']]],
    fonts: ['family=Jost:wght@400&display=swap', 'family=Assistant:wght@400&text=%D7%A2%D7%91%D7%A8%D7%99%D7%AA&display=swap'],
  },
};
const NOT_FOUND = { title: 'Page not found', kicker: 'Page not found', h1: 'That page isn’t here.', lede: 'It may have moved. Start again from the home page, or tell us what you were looking for.', home: 'Back to the home page', contact: 'Contact us' };
const REDIRECTS = [
  '# Old PHP mail handler (never ran on Netlify).',
  '/contact.php    /contact    301',
  '',
  '# Pages renamed on 15 Nov 2026.',
  '/private-clients    /owners    301',
  '/london-hq    /hampstead-office-fit-out    301',
  '/villa    /about    301',
  '',
  '# Trial of one forced rule: the .html address goes to the clean address.',
  '/privacy.html    /privacy    301!',
  '',
  '# Hebrew and Russian are one page each for now. Old inner pages go to it.',
  '/he/*    /he/    302',
  '/ru/*    /ru/    302',
  '',
].join('\n');

// ---- helpers ----------------------------------------------------------------
const rd = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const urlOf = (lang, slug) => LANG[lang].base + slug;
const outOf = (lang, slug) => path.join(DIST, lang === 'en' ? '' : lang, (slug || 'index') + '.html');
function loadPages(lang) {
  const dir = path.join(SRC, lang);
  return fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => {
    const raw = rd(path.join(dir, f));
    const m = raw.match(/^<!--(\{.*\})-->\n/);
    if (!m) throw new Error(`${lang}/${f}: first line must be <!--{...}-->`);
    return { lang, file: f, ...JSON.parse(m[1]), body: raw.slice(m[0].length).replace(/\n+$/, '') };
  });
}
const part = (name, lang) => rd(path.join(SRC, 'parts', `${name}.${lang}.html`)).replace(/\n+$/, '');
const langLinks = cur => Object.keys(LANG).filter(l => LISTED[l] || l === cur)
  .map(l => `<a href="${LANG[l].base}" lang="${LANG[l].html}" hreflang="${LANG[l].html}"${l === cur ? ' aria-current="true"' : ''}>${LANG[l].label}</a>`);

function head(p, url) {
  const L = LANG[p.lang];
  const title = p.slug === '' ? p.title : `${p.title} | Fedan`;
  const noindex = p.noindex || !LISTED[p.lang];
  const alts = p.slug === '' && LISTED[p.lang]
    ? [...Object.keys(LANG).filter(l => LISTED[l]).map(l => `<link rel="alternate" hreflang="${LANG[l].html}" href="${ORIGIN}${LANG[l].base}">`), `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/">`] : [];
  const jsonld = p.slug === '' && p.lang === 'en' ? [`<script type="application/ld+json">
  {"@context":"https://schema.org","@graph":[
    {"@type":"Organization","@id":"${ORIGIN}/#organization","name":"Fedan","legalName":"Fedan Ltd","url":"${ORIGIN}/","email":"${EMAIL}","telephone":"+447424282973","logo":"${ORIGIN}/apple-touch-icon.png","image":"${ORIGIN}/img/og-share.png","founder":{"@type":"Person","name":"Daniel Zhirov Fedan"},"address":{"@type":"PostalAddress","streetAddress":"Second Floor, Sutherland House, 70-78 West Hendon Broadway","addressLocality":"London","postalCode":"NW9 7BT","addressCountry":"GB"},"identifier":{"@type":"PropertyValue","propertyID":"UK Companies House","value":"17348292"},"areaServed":["North London","Surrey"]},
    {"@type":"WebSite","@id":"${ORIGIN}/#website","url":"${ORIGIN}/","name":"Fedan","publisher":{"@id":"${ORIGIN}/#organization"},"inLanguage":"en-GB"}
  ]}
  </script>`] : [];
  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    noindex ? '<meta name="robots" content="noindex">' : null,
    `<title>${title}</title>`,
    `<meta name="description" content="${p.description}">`,
    p.is404 ? null : `<link rel="canonical" href="${ORIGIN}${url}">`,
    ...alts,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Fedan">',
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${p.description}">`,
    p.is404 ? null : `<meta property="og:url" content="${ORIGIN}${url}">`,
    `<meta property="og:image" content="${ORIGIN}/img/og-share.png">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:locale" content="${L.og}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="theme-color" content="#f4f1ea">',
    '<link rel="icon" href="/favicon.ico" sizes="48x48">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    ...L.fonts.map(f => `<link href="https://fonts.googleapis.com/css2?${f}" rel="stylesheet">`),
    '<link rel="stylesheet" href="/styles.css">',
    ...jsonld,
  ].filter(Boolean).map(l => '  ' + l).join('\n');
}

function layout(p) {
  const L = LANG[p.lang], url = urlOf(p.lang, p.slug);
  const nav = L.nav.map(([h, t]) => `<a href="${h}"${h === '/' + p.slug ? ' aria-current="page"' : ''}>${t}</a>`).join('\n          ');
  const cols = L.foot.map((col, i) => `        <nav class="foot-col" aria-label="Site ${i + 1}">\n          ${col.map(([h, t]) => `<a href="${h}">${t}</a>`).join('\n          ')}${i === L.foot.length - 1 ? '\n          ' + langLinks(p.lang).join('') : ''}\n        </nav>`).join('\n');
  let body = p.body.replace(/\{\{enquiry\}\}/g, () => part('enquiry', p.lang).replace(/(name="page" value=")[^"]*(")/, `$1${p.label || p.title}$2`));
  return `<!DOCTYPE html>
<html lang="${L.html}" dir="${L.dir}">
<head>
${head(p, url)}
</head>
<body>
  <a class="skip" href="#main">${L.skip}</a>
  <header class="site">
    <div class="header-inner">
      <a class="wordmark" href="${L.base}" lang="en" aria-label="Fedan">FEDAN</a>
      <button class="menu-toggle" type="button" data-menu aria-expanded="false" aria-controls="nav">${L.menu}</button>
      <div class="nav-wrap" id="nav">
        <nav class="nav" aria-label="Main">
          ${nav}
        </nav>
        <div class="langs" aria-label="Language">
          ${langLinks(p.lang).join('\n          ')}
        </div>
        <a class="btn btn-sm" href="${L.contact[0]}">${L.contact[1]}</a>
      </div>
    </div>
  </header>

  <main id="main">
${body}
  </main>

  <footer class="site">
    <div class="wrap">
      <div class="foot">
        <div class="foot-brand">
          <a class="wordmark" href="${L.base}" lang="en">FEDAN</a>
          <p>${L.patch}</p>
          <p><a href="mailto:${EMAIL}" dir="ltr">${EMAIL}</a></p>
          <p data-tel-only hidden><a href="/contact#talk" data-tel-link dir="ltr"></a></p>
        </div>
${cols}
      </div>
      <p class="legal">${LEGAL}</p>
    </div>
  </footer>
  <script src="/script.js"></script>
</body>
</html>
`;
}

// ---- build ------------------------------------------------------------------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(STATIC, DIST, { recursive: true, filter: s => path.basename(s) !== 'desktop.ini' });

const pages = Object.keys(LANG).flatMap(loadPages);
pages.push({ lang: 'en', slug: '404', is404: true, noindex: true, title: NOT_FOUND.title, description: NOT_FOUND.kicker, body: `    <section class="page-hero">
      <div class="wrap">
        <p class="kicker">${NOT_FOUND.kicker}</p>
        <h1>${NOT_FOUND.h1}</h1>
        <p class="lede">${NOT_FOUND.lede}</p>
        <div class="btn-row"><a class="btn" href="/">${NOT_FOUND.home}</a><a class="btn btn-ghost" href="/contact">${NOT_FOUND.contact}</a></div>
      </div>
    </section>` });
for (const p of pages) {
  const out = outOf(p.lang, p.slug);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, layout(p));
}

const indexable = pages.filter(p => !p.noindex && LISTED[p.lang]).sort((a, b) => (a.lang + a.slug).localeCompare(b.lang + b.slug));
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map(p => `  <url><loc>${ORIGIN}${urlOf(p.lang, p.slug)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, '_redirects'), REDIRECTS);

// ---- checks -----------------------------------------------------------------
const problems = [];
const exists = p => { const cands = p.endsWith('/') ? [p + 'index.html'] : [p, p + '.html', p + '/index.html']; return cands.some(c => { const f = path.join(DIST, c); return fs.existsSync(f) && fs.statSync(f).isFile(); }); };
for (const p of pages) {
  const rel = path.relative(DIST, outOf(p.lang, p.slug)).replace(/\\/g, '/');
  const html = rd(outOf(p.lang, p.slug));
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]*>/g, ' ');
  if ((html.match(/<h1[ >]/g) || []).length !== 1) problems.push(`${rel}: needs exactly one h1`);
  if (/office@|www\.fedangroup/.test(html)) problems.push(`${rel}: old email or www address`);
  if (/\{\{|\[[A-Z][^\]]{12,}\]/.test(text)) problems.push(`${rel}: placeholder left in the text`);
  if (p.lang === 'en' && / - /.test(text)) problems.push(`${rel}: spaced hyphen in the text`);
  if (/—/.test(text)) problems.push(`${rel}: em dash in the text`);
  if (p.description.length > 200) problems.push(`${rel}: description over 200 characters`);
  for (const m of html.matchAll(/(?:href|src|action)="([^"]*)"/g)) {
    const v = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/i.test(v) || v === '') continue;
    if (!v.startsWith('/')) { problems.push(`${rel}: link is not root-absolute: ${v}`); continue; }
    const pathOnly = decodeURIComponent(v.split('#')[0].split('?')[0]);
    if (!exists(pathOnly)) problems.push(`${rel}: broken link ${v}`);
  }
}
const titles = pages.map(p => p.lang + '|' + p.title);
titles.forEach((t, i) => { if (titles.indexOf(t) !== i) problems.push(`duplicate title: ${t}`); });
console.log(`built ${pages.length} pages into dist/ (${indexable.length} in the sitemap); Hebrew listed: ${LISTED.he}; Russian listed: ${LISTED.ru}`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'checks passed: one h1 per page, every internal link resolves, no placeholders, no old addresses, no spaced hyphens or em dashes');
if (problems.length) process.exitCode = 1;
