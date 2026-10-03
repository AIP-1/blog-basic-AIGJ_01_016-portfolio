/**
 * 홈: 최신 글 목록 + 페이지네이션
 */
const POSTS_PER_PAGE = 5;

function postItemHTML(post) {
  const thumb = post.thumbnail
    ? `<img class="post-thumb" src="${escapeHTML(post.thumbnail)}" alt="">`
    : `<div class="post-thumb is-placeholder">${escapeHTML(post.category.charAt(0))}</div>`;

  return `
    <li class="post-item">
      <a href="post.html?id=${post.id}">
        <div class="post-body">
          <span class="category-label">${escapeHTML(post.category)}</span>
          <h3 class="post-title">${escapeHTML(post.title)}</h3>
          <p class="post-summary">${escapeHTML(htmlToText(post.content))}</p>
          <p class="post-meta">
            <span>${formatDate(post.createdAt)}</span>
            <span>조회 ${post.views}</span>
            <span>공감 ${post.likes}</span>
          </p>
        </div>
        ${thumb}
      </a>
    </li>`;
}

function paginationHTML(current, total) {
  if (total <= 1) return '';
  let links = '';
  for (let i = 1; i <= total; i++) {
    const cls = i === current ? ' class="is-current"' : '';
    links += `<a href="?page=${i}"${cls}>${i}</a>`;
  }
  return `<nav class="pagination" aria-label="페이지">${links}</nav>`;
}

function renderHome() {
  const posts = Store.getPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const page = Math.min(Math.max(1, Number(getQueryParam('page')) || 1), totalPages);
  const start = (page - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);

  const list = pagePosts.length
    ? `<ul class="post-list">${pagePosts.map(postItemHTML).join('')}</ul>`
    : '<p class="empty">아직 작성된 글이 없습니다.</p>';

  document.getElementById('content').innerHTML = `
    <h2 class="page-heading">전체 글<span class="count">${posts.length}</span></h2>
    ${list}
    ${paginationHTML(page, totalPages)}`;
}

renderHome();
