const fs = require('fs');
const path = require('path');

const articles = JSON.parse(fs.readFileSync('data/articles.json', 'utf-8'));
const articleTemplate = fs.readFileSync('_templates/article.html', 'utf-8');

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getDepth(slug) {
  const parts = slug.split('/').filter(Boolean);
  return '../'.repeat(parts.length);
}

function buildArticle(article) {
  const depth = getDepth(article.slug);
  let page = articleTemplate;

  const featuredImageHtml = article.featuredImage
    ? `<figure class="article-page__featured"><img src="${depth}${article.featuredImage}" alt="${article.featuredImageAlt || ''}" loading="eager" /></figure>`
    : '';

  page = page.split('{{TITLE}}').join(article.title);
  page = page.split('{{SLUG}}').join(article.slug);
  page = page.split('{{EXCERPT}}').join(article.excerpt);
  page = page.split('{{CATEGORY}}').join(article.category);
  page = page.split('{{CATEGORY_LABEL}}').join(article.categoryLabel);
  page = page.split('{{FEATURED_IMAGE_HTML}}').join(featuredImageHtml);
  page = page.split('{{DATE}}').join(article.date);
  page = page.split('{{DATE_FORMATTED}}').join(formatDate(article.date));
  page = page.split('{{BODY}}').join(article.body);
  page = page.split('{{DEPTH}}').join(depth);

  const outDir = path.join(...article.slug.split('/'));
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'index.html');
  fs.writeFileSync(outPath, page, 'utf-8');
  console.log(`✅ Built: ${outPath}`);
}

articles.forEach(buildArticle);
console.log(`\n🎉 Done — built ${articles.length} article(s)`);
