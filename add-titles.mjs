import { readFileSync, writeFileSync } from 'node:fs';

const files = ['index.html', 'about.html', 'signup.html'];

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/\s+/g, ' ').trim();
// visible text of an anchor: drop tags, collapse ws, drop trailing arrow
const textOf = html => html.replace(/<[^>]*>/g, ' ').replace(/→/g, '').replace(/\s+/g, ' ').trim();

for (const f of files) {
  let html = readFileSync(f, 'utf8');
  let imgAdded = 0, aAdded = 0;

  // <img ...> without title -> mirror alt (fallback "Atrovia")
  html = html.replace(/<img\b([^>]*?)>/g, (m, attrs) => {
    if (/\btitle\s*=/.test(attrs)) return m;
    const alt = (attrs.match(/\balt\s*=\s*"([^"]*)"/) || [])[1] || 'Atrovia';
    imgAdded++;
    return `<img title="${esc(alt)}"${attrs}>`;
  });

  // <a ...>...</a> without title -> derive from link text / aria-label
  html = html.replace(/<a\b([^>]*?)>([\s\S]*?)<\/a>/g, (m, attrs, inner) => {
    if (/\btitle\s*=/.test(attrs)) return m;
    let t = textOf(inner);
    if (!t) t = (attrs.match(/\baria-label\s*=\s*"([^"]*)"/) || [])[1] || '';
    if (!t) t = (inner.match(/\balt\s*=\s*"([^"]*)"/) || [])[1] || 'Atrovia';
    aAdded++;
    return `<a title="${esc(t)}"${attrs}>${inner}</a>`;
  });

  writeFileSync(f, html);
  console.log(`${f}: +${imgAdded} img titles, +${aAdded} link titles`);
}
