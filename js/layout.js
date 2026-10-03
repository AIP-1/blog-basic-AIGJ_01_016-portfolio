/**
 * 공통 레이아웃
 * 모든 페이지에 들어가는 헤더, 사이드바, 푸터를 그린다.
 * 각 HTML에 <div id="header"></div> 같은 자리만 만들어 두면 된다.
 */
const BLOG = {
  title: '한채',
  owner: 'Minju',
  description: '배운 것을 기록하는 개발 블로그',
};

// 사용자 입력이 HTML로 해석되지 않도록 특수문자를 바꿔 준다
function escapeHTML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}. ${m}. ${d}.`;
}

function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function searchFormHTML() {
  const keyword = getQueryParam('q') || '';
  return `
    <form class="search-form" action="search.html" method="get">
      <input type="search" name="q" placeholder="검색어 입력" value="${escapeHTML(keyword)}" aria-label="검색어">
      <button type="submit">검색</button>
    </form>`;
}

// 로그인했으면 닉네임과 로그아웃, 아니면 로그인 링크
function authAreaHTML() {
  const user = Auth.currentUser();
  if (!user) {
    return '<div class="header-auth"><a href="index.html?auth=login">로그인</a></div>';
  }
  return `
    <div class="header-auth">
      <span class="nickname">${escapeHTML(user.nickname)}님</span>
      <button type="button" id="logout-button">로그아웃</button>
    </div>`;
}

function renderHeader() {
  const page = location.pathname.split('/').pop() || 'blog.html';
  const navItems = [
    { href: 'blog.html', label: '홈' },
    { href: 'guestbook.html', label: '방명록' },
    { href: 'admin/write.html', label: '글쓰기' },
  ];

  const nav = navItems
    .map((item) => {
      const active = item.href === page ? ' class="is-active"' : '';
      return `<a href="${item.href}"${active}>${item.label}</a>`;
    })
    .join('');

  document.getElementById('header').innerHTML = `
    <header class="site-header">
      <div class="inner">
        <a class="site-logo" href="blog.html">${escapeHTML(BLOG.title)}</a>
        <nav class="site-nav">${nav}</nav>
        ${searchFormHTML()}
        ${authAreaHTML()}
        <button class="menu-toggle" type="button" aria-label="메뉴 열기">☰</button>
      </div>
    </header>`;
}

function renderSidebar() {
  const posts = Store.getPosts();

  const categories = Store.getCategories()
    .map((c) => `
      <li><a href="category.html?name=${encodeURIComponent(c.name)}">
        <span class="title">${escapeHTML(c.name)}</span><span class="count">(${c.count})</span>
      </a></li>`)
    .join('');

  const postLinks = (list) => list
    .map((post) => `
      <li><a href="post.html?id=${post.id}">
        <span class="title">${escapeHTML(post.title)}</span>
      </a></li>`)
    .join('');

  const tags = Store.getTags()
    .map((tag) => `<a class="tag" href="tag.html?name=${encodeURIComponent(tag)}">${escapeHTML(tag)}</a>`)
    .join('');

  document.getElementById('sidebar').innerHTML = `
    ${searchFormHTML()}

    <section class="profile">
      <div class="profile-avatar">${escapeHTML(BLOG.title.charAt(0))}</div>
      <p class="profile-name">${escapeHTML(BLOG.owner)}</p>
      <p class="profile-desc">${escapeHTML(BLOG.description)}</p>
    </section>

    <section>
      <h2 class="widget-title">카테고리</h2>
      <ul class="widget-list">
        <li><a href="blog.html"><span class="title">전체</span><span class="count">(${posts.length})</span></a></li>
        ${categories}
      </ul>
    </section>

    <section>
      <h2 class="widget-title">최근 글</h2>
      <ul class="widget-list">${postLinks(Store.getRecentPosts(5))}</ul>
    </section>

    <section>
      <h2 class="widget-title">인기 글</h2>
      <ul class="widget-list">${postLinks(Store.getPopularPosts(5))}</ul>
    </section>

    <section>
      <h2 class="widget-title">태그</h2>
      <div class="tag-cloud">${tags}</div>
    </section>`;
}

function renderFooter() {
  const year = new Date().getFullYear();
  document.getElementById('footer').innerHTML = `
    <footer class="site-footer">
      <div class="inner">© ${year} ${escapeHTML(BLOG.owner)}. All rights reserved.</div>
    </footer>`;
}

// 모바일 메뉴(사이드바 서랍) 열고 닫기
function setupMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const overlay = document.querySelector('.overlay');

  toggle.addEventListener('click', () => document.body.classList.add('menu-open'));
  overlay.addEventListener('click', () => document.body.classList.remove('menu-open'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.body.classList.remove('menu-open');
  });
}

function setupLogout() {
  const button = document.getElementById('logout-button');
  if (!button) return;
  button.addEventListener('click', () => {
    Auth.logOut();
    location.reload();
  });
}

renderHeader();
renderSidebar();
renderFooter();
setupMobileMenu();
setupLogout();
