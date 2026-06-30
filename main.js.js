/**
 * IT Charging Orchestrator - Final Version
 * Includes: Content Fetching, Video Facade, and Category Filtering.
 */
let allArticles = [];

async function initSystem() {
    const feed = document.getElementById('content-feed');
    const response = await fetch('content.json');
    allArticles = await response.json();
    renderFeed(allArticles);
}

function renderFeed(articles) {
    const feed = document.getElementById('content-feed');
    feed.innerHTML = articles.map(post => `
        <div class="article-card" data-category="${post.category}">
            <h2>${post.title}</h2>
            <p>${post.desc}</p>
            <div class="video-container" id="video-${post.videoId}" onclick="playVideo('${post.videoId}')">
                <img src="https://img.youtube.com/vi/${post.videoId}/maxresdefault.jpg" style="width:100%; cursor:pointer;">
            </div>
        </div>
    `).join('');
}

function filterByCategory(category) {
    const filtered = category === 'all' 
        ? allArticles 
        : allArticles.filter(a => a.category === category);
    renderFeed(filtered);
}

function playVideo(id) {
    const container = document.getElementById(`video-${id}`);
    container.innerHTML = `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${id}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
}

document.addEventListener('DOMContentLoaded', initSystem);