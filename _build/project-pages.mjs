/* Build one page per project from projects.js.
   Run from the portfolio folder:  node _build/project-pages.mjs
   Writes projects/<slug>.html, each with its own description, facts, gallery
   and previous / next row. Re-run after adding a project. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const sandbox = { window: {} };
new Function('window', readFileSync(join(root, 'projects.js'), 'utf8'))(sandbox.window);
const P = sandbox.window.PROJECTS;
const order = sandbox.window.PROJECT_ORDER;

const sorted = order.map((s) => P.find((p) => p.slug === s)).filter(Boolean);
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const head = (title, description) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="theme-color" content="#f1ece2" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316120d'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='15' fill='%23f1ece2' text-anchor='middle'%3EIR%3C/text%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Inter:wght@300..600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../styles.css" />
</head>
<body id="top">
<a class="skip" href="#main">Skip to content</a>

<header class="site-head">
  <div class="wrap site-head__in">
    <a class="brand" href="../index.html"><b>Imaan Rafiq</b><span>Product designer</span></a>
    <nav class="nav" aria-label="Primary">
      <span class="nav__primary">
        <a href="../index.html#work">Work</a>
        <a href="../work.html">Archive</a>
        <a href="../index.html#studio">About</a>
      </span>
      <span class="status"><i></i>Open to work</span>
      <a class="head-contact" href="mailto:imaanrafiq234@gmail.com?subject=Enquiry%20from%20your%20portfolio">Email me <span aria-hidden="true">↗</span></a>
    </nav>
  </div>
</header>
`;

const foot = `
<footer class="site-foot">
  <div class="wrap site-foot__in">
    <span>© <span data-year>2026</span> Imaan Rafiq · All work shown is the designer’s own</span>
    <span><a href="../index.html">Home</a> · <a href="../work.html">Archive</a> · <a href="mailto:imaanrafiq234@gmail.com?subject=Enquiry%20from%20your%20portfolio">Email</a> · <a href="#top">Top ↑</a></span>
  </div>
</footer>

<script src="../app.js" defer></script>
</body>
</html>
`;

mkdirSync(join(root, 'projects'), { recursive: true });

sorted.forEach((p, i) => {
  const prev = sorted[i - 1];
  const next = sorted[i + 1];
  const num = String(i + 1).padStart(2, '0');
  const rest = p.imgs.slice(1);

  const studyHref = p.study && /^(https?:|mailto:|#|\/)/i.test(p.study) ? p.study : `../${p.study || ''}`;
  const study = p.study
    ? `\n      <p class="proj__study"><a class="btn btn--ghost" href="${esc(studyHref)}">${esc(
        p.studyLabel || 'Read the full case study'
      )}</a></p>`
    : '';

  const gallery = rest.length
    ? `
  <section class="wrap proj__gallery" aria-label="Project images">
${rest
  .map(
    (src, n) =>
      `    <a href="../assets/img/${esc(src)}" target="_blank" rel="noopener" title="Open full size"><img src="../assets/img/${esc(
        src
      )}" alt="${esc(p.title)}, image ${n + 2}" loading="lazy" /></a>`
  )
  .join('\n')}
  </section>

  <p class="wrap proj__count">${p.imgs.length} ${p.imgs.length === 1 ? 'image' : 'images'} · ${esc(
    p.kind
  )} · ${esc(p.year)}</p>`
    : '';

  const html = `${head(`${p.title} · Imaan Rafiq`, p.summary)}
<main id="main">
  <article class="proj">
    <section class="wrap page-head proj__head" style="padding-bottom:0">
      <a class="proj__back" href="../work.html"><span aria-hidden="true">←</span> All projects</a>
      <span class="eyebrow" style="display:block;margin-top:1.4rem"><span class="n">${num}</span> · ${esc(
  p.kind
)} · ${esc(p.year)}</span>
      <h1>${esc(p.title)}</h1>
      <p class="lead">${esc(p.sub)}</p>
      <div class="proj__meta"><span>${esc(p.year)}</span><span>${esc(p.kind)}</span><span>${
  p.imgs.length
} ${p.imgs.length === 1 ? 'image' : 'images'}</span></div>${study}
    </section>

    <figure class="wrap proj__hero">
      <img src="../assets/img/${esc(p.cover)}" alt="${esc(p.title)}, project cover" />
    </figure>

    <section class="wrap proj__layout">
      <div class="proj__copy">
        <p>${esc(p.summary)}</p>
        <p>${esc(p.note)}</p>
      </div>
      <dl class="proj__facts">
        <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
        <div><dt>Discipline</dt><dd>${esc(p.kind)}</dd></div>
        <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
        <div><dt>Tools</dt><dd>${esc(p.tools)}</dd></div>
      </dl>
    </section>
${gallery}
    <nav class="wrap proj__pager" aria-label="Project navigation">
      ${prev ? `<a href="${esc(prev.slug)}.html">← ${esc(prev.title)}</a>` : '<span></span>'}
      <a class="mid" href="../work.html">Archive</a>
      ${next ? `<a href="${esc(next.slug)}.html">${esc(next.title)} →</a>` : '<span></span>'}
    </nav>
  </article>
</main>
${foot}`;

  writeFileSync(join(root, 'projects', `${p.slug}.html`), html.replace(/\r?\n/g, '\n'), 'utf8');
});

console.log(`wrote ${sorted.length} project pages to projects/`);
