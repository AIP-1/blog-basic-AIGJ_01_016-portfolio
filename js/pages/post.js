/**
 * 글 상세: 제목, 본문, 태그, 이전/다음 글, 수정/삭제
 */
function postNavHTML(post, label, className) {
  if (!post) {
    return `<div class="none ${className}"><span class="label">${label}</span><span class="title">글이 없습니다</span></div>`;
  }
  return `
    <a class="${className}" href="post.html?id=${post.id}">
      <span class="label">${label}</span>
      <span class="title">${escapeHTML(post.title)}</span>
    </a>`;
}

function renderPost() {
  const id = getQueryParam('id');
  const post = Store.getPost(id);
  const content = document.getElementById('content');

  if (!post) {
    content.innerHTML = '<p class="empty">존재하지 않거나 삭제된 글입니다.</p>';
    return;
  }

  Store.increaseViews(post.id);
  post.views += 1;
  document.title = `${post.title} - ${BLOG.title}`;

  const tags = post.tags
    .map((tag) => `<a class="tag" href="tag.html?name=${encodeURIComponent(tag)}">#${escapeHTML(tag)}</a>`)
    .join('');

  const { newer, older } = Store.getAdjacentPosts(post.id);

  content.innerHTML = `
    <article class="post-detail">
      <header class="post-header">
        <a class="category-label" href="category.html?name=${encodeURIComponent(post.category)}">${escapeHTML(post.category)}</a>
        <h1>${escapeHTML(post.title)}</h1>
        <div class="post-info">
          <span>${formatDate(post.createdAt)}</span>
          <span>조회 ${post.views}</span>
          <div class="post-actions">
            <a href="admin/write.html?id=${post.id}">수정</a>
            <button type="button" id="delete-post">삭제</button>
          </div>
        </div>
      </header>

      <div class="post-content">${sanitizeHTML(post.content)}</div>

      ${tags ? `<div class="post-tags">${tags}</div>` : ''}

      <nav class="post-nav" aria-label="이전 글, 다음 글">
        ${postNavHTML(older, '이전 글', 'prev')}
        ${postNavHTML(newer, '다음 글', 'next')}
      </nav>
    </article>`;

  document.getElementById('delete-post').addEventListener('click', () => {
    if (!confirm('이 글을 삭제할까요? 삭제한 글은 되돌릴 수 없습니다.')) return;
    if (Store.deletePost(post.id)) {
      location.href = 'blog.html';
    } else {
      alert('삭제하지 못했습니다. 다시 시도해 주세요.');
    }
  });
}

renderPost();
