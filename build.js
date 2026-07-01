const fs = require('fs');
const path = require('path');

// ── LOAD DATA ──────────────────────────────────────────────────────
const config   = JSON.parse(fs.readFileSync('data/config.json', 'utf-8'));
const articles = JSON.parse(fs.readFileSync('data/articles.json', 'utf-8'));
const pages    = JSON.parse(fs.readFileSync('data/pages.json', 'utf-8'));

const articleTpl  = fs.readFileSync('_templates/article.html', 'utf-8');
const pageTpl     = fs.readFileSync('_templates/page.html', 'utf-8');
const homeTpl     = fs.readFileSync('_templates/home.html', 'utf-8');
const categoryTpl = fs.readFileSync('_templates/category.html', 'utf-8');

const now = new Date();

// ── HELPERS ────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function isPublished(item) {
  if (item.status === 'draft') return false;
  if (!item.publishDate) return true;
  return new Date(item.publishDate) <= now;
}

function getDepth(slug) {
  return '../'.repeat(slug.split('/').filter(Boolean).length);
}

function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Convert WordPress block HTML to clean HTML
function convertWP(html) {
  if (!html) return '';
  return html
    .replace(/<!--\s*\/?wp:[^\-].*?-->/gs, '')
    .replace(/<figure[^>]*class="[^"]*wp-block-(image|table|embed)[^"]*"[^>]*>(.*?)<\/figure>/gs, (m, type, inner) => {
      if (type === 'table') return inner;
      if (type === 'embed') {
        const src = inner.match(/https:\/\/(?:www\.youtube\.com|youtu\.be)[^\s"<]*/);
        return src ? `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${getYoutubeId(src[0])}" loading="lazy" allowfullscreen></iframe></div>` : '';
      }
      return inner.replace(/<figcaption[^>]*>.*?<\/figcaption>/gs, '');
    })
    .replace(/<div[^>]*class="[^"]*wp-block-group[^"]*"[^>]*>/g, '<div>')
    .replace(/class="wp-block-[^"]*"/g, '')
    .replace(/class="has-[^"]*"/g, '')
    .replace(/class="is-style-[^"]*"/g, '')
    .replace(/<details[^>]*>[\s\S]*?<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/gs, '<h3>$1</h3>$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getYoutubeId(url) {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : '';
}

// Build nav HTML
function buildNav(depth, activeCategory) {
  return config.nav.map(item => {
    const active = activeCategory && item.url.includes(activeCategory) ? ' class="active"' : '';
    return `<li><a href="${depth}${item.url}"${active}>${item.label}</a></li>`;
  }).join('\n        ');
}

// Build mobile menu nav
function buildMobileNav(depth) {
  const mainLinks = config.nav.map(item => `<li><a href="${depth}${item.url}">${item.label}</a></li>`).join('\n');
  const pageLinks = pages.filter(p => p.showInMenu).map(p => `<li><a href="${depth}${p.slug}/">${p.title}</a></li>`).join('\n');
  return mainLinks + '\n' + pageLinks;
}

// Build footer HTML
function buildFooter(depth) {
  const cols = config.footer.columns.map(col => `
    <div>
      <h4>${col.title}</h4>
      <ul>${col.links.map(l => `<li><a href="${depth}${l.url}">${l.label}</a></li>`).join('')}</ul>
    </div>`).join('');
  
  const social = `
    <div class="footer-social">
      ${config.social.facebook ? `<a href="${config.social.facebook}" aria-label="${config.site.name} on Facebook"><svg viewBox="0 0 24 24"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.06 5.66 21.2 10.44 22v-7.02H7.9v-2.92h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.87h2.78l-.44 2.92h-2.34V22C18.34 21.2 22 17.06 22 12.06Z"/></svg></a>` : ''}
      ${config.social.twitter ? `<a href="${config.social.twitter}" aria-label="${config.site.name} on X"><svg viewBox="0 0 24 24"><path d="M3 3h4.4l4.1 5.6L16.2 3H21l-7 8.6L21.4 21H17l-4.4-6-5.1 6H3l7.4-8.9L3 3Z"/></svg></a>` : ''}
      ${config.social.instagram ? `<a href="${config.social.instagram}" aria-label="${config.site.name} on Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.4" cy="6.6" r="1.1"/></svg></a>` : ''}
    </div>`;

  return `
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <img src="${config.site.logo}" alt="${config.site.name} logo" />
      <p>${config.site.tagline}</p>
      ${social}
    </div>
    ${cols}
  </div>
  <div class="wrap footer-bottom">
    <span>&copy; ${now.getFullYear()} ${config.site.name}. All rights reserved.</span>
  </div>`;
}

// Fill shared template variables
function fillShared(tpl, depth, opts = {}) {
  const nav = buildNav(depth, opts.category);
  const mobileNav = buildMobileNav(depth);
  const footer = buildFooter(depth);
  
  return tpl
    .split('{{SITE_NAME}}').join(config.site.name)
    .split('{{SITE_URL}}').join(config.site.url)
    .split('{{SITE_TAGLINE}}').join(config.site.tagline)
    .split('{{SITE_LOGO}}').join(config.site.logo)
    .split('{{SITE_FAVICON}}').join(config.site.favicon)
    .split('{{ADSENSE_ID}}').join(config.site.adsenseId)
    .split('{{GA_ID}}').join(config.site.googleAnalytics || '')
    .split('{{COLOR_PRIMARY}}').join(config.design.colorPrimary)
    .split('{{FONT_DISPLAY}}').join(config.design.fontDisplay)
    .split('{{FONT_BODY}}').join(config.design.fontBody)
    .split('{{NAV_LINKS}}').join(nav)
    .split('{{MOBILE_NAV}}').join(mobileNav)
    .split('{{FOOTER_HTML}}').join(footer)
    .split('{{DEPTH}}').join(depth);
}

// Write file
function write(slug, html) {
  const parts = slug.split('/').filter(Boolean);
  const dir = parts.length ? path.join(...parts) : '.';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  console.log(`✅ ${path.join(dir, 'index.html')}`);
}

// ── BUILD ARTICLES ─────────────────────────────────────────────────
const published = articles.filter(isPublished);

published.forEach(article => {
  const slug = article.slug || slugify(article.title);
  const depth = getDepth(slug);
  const body = convertWP(article.body);
  const featuredImg = article.featuredImage
    ? `<figure class="article-page__featured"><img src="${depth}${article.featuredImage}" alt="${esc(article.featuredImageAlt)}" loading="eager" /></figure>`
    : '';
  const breadcrumbCat = article.category
    ? `<li><a href="${depth}category/${article.category}/">${article.categoryLabel}</a></li>`
    : '';

  let html = fillShared(articleTpl, depth, { category: article.category });
  html = html
    .split('{{TITLE}}').join(article.title)
    .split('{{SLUG}}').join(slug)
    .split('{{EXCERPT}}').join(article.excerpt || '')
    .split('{{CATEGORY}}').join(article.category || '')
    .split('{{CATEGORY_LABEL}}').join(article.categoryLabel || '')
    .split('{{BREADCRUMB_CAT}}').join(breadcrumbCat)
    .split('{{FEATURED_IMAGE_HTML}}').join(featuredImg)
    .split('{{DATE}}').join(article.publishDate || article.date || '')
    .split('{{DATE_FORMATTED}}').join(formatDate(article.publishDate || article.date))
    .split('{{BODY}}').join(body)
    .split('{{EYEBROW}}').join(article.categoryLabel || '');

  write(slug, html);
});

// ── BUILD PAGES ────────────────────────────────────────────────────
const publishedPages = pages.filter(isPublished);

publishedPages.forEach(page => {
  const slug = page.slug || slugify(page.title);
  const depth = getDepth(slug);
  const body = convertWP(page.body);

  let html = fillShared(pageTpl, depth);
  html = html
    .split('{{TITLE}}').join(page.title)
    .split('{{SLUG}}').join(slug)
    .split('{{EXCERPT}}').join(page.excerpt || '')
    .split('{{BODY}}').join(body);

  write(slug, html);
});

// ── BUILD CATEGORY PAGES ───────────────────────────────────────────
const categories = [...new Set(published.filter(a => a.category).map(a => a.category))];

categories.forEach(cat => {
  const catArticles = published.filter(a => a.category === cat).reverse();
  const catLabel = catArticles[0]?.categoryLabel || cat;
  const slug = `category/${cat}`;
  const depth = getDepth(slug);

  const cards = catArticles.map(a => {
    const thumb = a.featuredImage
      ? `<img src="${depth}${a.featuredImage}" alt="${esc(a.featuredImageAlt)}" loading="lazy" />`
      : `<div class="card__thumb-placeholder"></div>`;
    return `<article class="card">
      <a class="card__thumb" href="${depth}${a.slug || slugify(a.title)}/">${thumb}</a>
      <div class="card__body">
        <h3><a href="${depth}${a.slug || slugify(a.title)}/">${a.title}</a></h3>
        <p>${a.excerpt || ''}</p>
      </div>
    </article>`;
  }).join('\n');

  let html = fillShared(categoryTpl, depth, { category: cat });
  html = html
    .split('{{CAT_LABEL}}').join(catLabel)
    .split('{{CAT_SLUG}}').join(cat)
    .split('{{CAT_COUNT}}').join(catArticles.length)
    .split('{{CARDS}}').join(cards || '<p class="no-articles">No articles yet.</p>');

  write(slug, html);
});

// ── BUILD HOMEPAGE ─────────────────────────────────────────────────
const allPublished = [...published].reverse();
const hero = allPublished[0];
const latest = allPublished.slice(0, 10);
const grid = allPublished.slice(1);

const heroHtml = hero ? `
  <div class="hp-latest">
    <div class="hp-latest__label">The Latest</div>
    <ul class="hp-latest__list">
      ${latest.map(a => `<li class="hp-latest__item">
        <a href="${a.slug || slugify(a.title)}/">${a.title}</a>
        <span class="hp-latest__time">${a.categoryLabel || ''}</span>
      </li>`).join('')}
    </ul>
  </div>
  <div class="hp-hero__img">
    ${hero.featuredImage
      ? `<a href="${hero.slug || slugify(hero.title)}/"><img src="${hero.featuredImage}" alt="${esc(hero.featuredImageAlt)}" /></a>`
      : `<div class="hp-hero__img-placeholder"></div>`}
  </div>
  <div class="hp-hero__text">
    <span class="hp-hero__cat">${hero.categoryLabel || ''}</span>
    <h1 class="hp-hero__title"><a href="${hero.slug || slugify(hero.title)}/">${hero.title}</a></h1>
    <p class="hp-hero__excerpt">${hero.excerpt || ''}</p>
  </div>` : '<div class="hp-empty">No articles yet. Add your first article in the admin panel.</div>';

const gridHtml = grid.map(a => {
  const thumb = a.featuredImage
    ? `<img class="hp-card__thumb" src="${a.featuredImage}" alt="${esc(a.featuredImageAlt)}" loading="lazy" />`
    : `<div class="hp-card__thumb-placeholder"></div>`;
  return `<div class="hp-card">
    <div>
      <div class="hp-card__cat">${a.categoryLabel || ''}</div>
      <div class="hp-card__title"><a href="${a.slug || slugify(a.title)}/">${a.title}</a></div>
    </div>
    ${thumb}
  </div>`;
}).join('');

let homeHtml = fillShared(homeTpl, '');
homeHtml = homeHtml
  .split('{{HERO_HTML}}').join(heroHtml)
  .split('{{GRID_HTML}}').join(gridHtml || '');

fs.writeFileSync('index.html', homeHtml, 'utf-8');
console.log('✅ index.html');

// ── BUILD SITEMAP ──────────────────────────────────────────────────
const sitemapUrls = [
  `<url><loc>${config.site.url}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
  ...published.map(a => `<url><loc>${config.site.url}/${a.slug || slugify(a.title)}/</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`),
  ...publishedPages.map(p => `<url><loc>${config.site.url}/${p.slug || slugify(p.title)}/</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>`),
  ...categories.map(c => `<url><loc>${config.site.url}/category/${c}/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
];

fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`, 'utf-8');
console.log('✅ sitemap.xml');

console.log(`\n🎉 Build complete — ${published.length} articles, ${publishedPages.length} pages, ${categories.length} categories`);
