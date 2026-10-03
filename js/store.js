/**
 * 데이터 저장소
 * 글 데이터를 localStorage에 저장하고 꺼내 쓴다.
 * 나중에 서버(Firebase 등)로 바꿀 때는 이 파일만 고치면 된다.
 *
 * 글(post) 구조
 * { id, title, category, tags: [], content: 'HTML 문자열', thumbnail, createdAt, updatedAt, views, likes }
 */
const Store = (function () {
  const POSTS_KEY = 'blog.posts';

  // 처음 실행할 때 넣어 둘 샘플 글 (본문은 에디터가 만드는 것과 같은 HTML)
  const SAMPLE_POSTS = [
    {
      id: 1,
      title: '블로그를 시작합니다',
      category: '일상',
      tags: ['블로그', '시작'],
      content: '<p>티스토리 같은 블로그를 직접 만들어 보기로 했다.</p><p><strong>HTML, CSS, JavaScript</strong>만으로 글 목록, 카테고리, 태그, 검색, 댓글까지 하나씩 구현해 볼 예정이다.</p>',
      thumbnail: '',
      createdAt: '2026-09-20T10:00:00',
      views: 42,
      likes: 3,
    },
    {
      id: 2,
      title: 'HTML 시맨틱 태그 정리',
      category: 'HTML',
      tags: ['HTML', '웹표준', '접근성'],
      content: '<p>시맨틱 태그를 쓰면 문서 구조가 명확해지고 검색엔진과 스크린리더가 내용을 더 잘 이해할 수 있다.</p><h2>자주 쓰는 태그</h2><ul><li><code>header</code>, <code>footer</code>: 머리말과 꼬리말</li><li><code>nav</code>: 메뉴</li><li><code>main</code>: 핵심 내용</li><li><code>aside</code>: 사이드바</li><li><code>article</code>, <code>section</code>: 글과 구역</li></ul><blockquote>div만 쓰는 대신 의미에 맞는 태그를 고르는 습관을 들이자.</blockquote>',
      thumbnail: '',
      createdAt: '2026-09-22T14:30:00',
      views: 128,
      likes: 12,
    },
    {
      id: 3,
      title: 'CSS Grid로 2단 레이아웃 만들기',
      category: 'CSS',
      tags: ['CSS', 'Grid', '레이아웃'],
      content: '<p>한 줄이면 본문과 사이드바로 나뉜 블로그 레이아웃을 만들 수 있다.</p><pre>.layout {\n  display: grid;\n  grid-template-columns: 1fr 280px;\n}</pre><p>모바일에서는 미디어 쿼리로 <code>1fr</code> 한 칸으로 바꿔 주면 된다.</p>',
      thumbnail: '',
      createdAt: '2026-09-24T09:15:00',
      views: 256,
      likes: 20,
    },
    {
      id: 4,
      title: 'localStorage로 데이터 저장하기',
      category: 'JavaScript',
      tags: ['JavaScript', 'localStorage'],
      content: '<p>localStorage는 브라우저에 <strong>문자열</strong>을 저장하는 공간이다.</p><ol><li>저장할 때: <code>JSON.stringify</code>로 객체를 문자열로 바꾼다.</li><li>꺼낼 때: <code>JSON.parse</code>로 다시 객체로 바꾼다.</li></ol><p>서버 없이도 데이터를 유지할 수 있어 연습용 프로젝트에 유용하다.</p>',
      thumbnail: '',
      createdAt: '2026-09-26T20:40:00',
      views: 87,
      likes: 7,
    },
    {
      id: 5,
      title: '반응형 웹을 위한 미디어 쿼리',
      category: 'CSS',
      tags: ['CSS', '반응형'],
      content: '<p><code>@media (max-width: 860px)</code>처럼 화면 너비에 따라 다른 스타일을 적용할 수 있다.</p><p>모바일에서는 사이드바를 서랍 메뉴로 바꾸고 글자 크기를 조금 줄여 가독성을 맞춘다.</p>',
      thumbnail: '',
      createdAt: '2026-09-28T11:05:00',
      views: 64,
      likes: 5,
    },
    {
      id: 6,
      title: 'DOM 조작 기초: querySelector와 innerHTML',
      category: 'JavaScript',
      tags: ['JavaScript', 'DOM'],
      content: '<p><code>document.querySelector</code>로 요소를 찾고 <code>innerHTML</code>이나 <code>textContent</code>로 내용을 바꾼다.</p><p style="color: rgb(220, 38, 38);">사용자가 입력한 값을 innerHTML에 그대로 넣으면 보안 문제가 생길 수 있으니 반드시 걸러서 넣자.</p>',
      thumbnail: '',
      createdAt: '2026-09-30T16:20:00',
      views: 33,
      likes: 2,
    },
  ];

  function loadPosts() {
    try {
      const saved = localStorage.getItem(POSTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // 저장소를 쓸 수 없는 환경이면 샘플 글로 대체
    }
    savePosts(SAMPLE_POSTS);
    return SAMPLE_POSTS.slice();
  }

  // 저장에 성공하면 true (이미지가 많아 용량을 넘으면 false)
  function savePosts(posts) {
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      return true;
    } catch (e) {
      return false;
    }
  }

  // 최신 글이 먼저 오도록 정렬
  function getPosts() {
    return loadPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getPost(id) {
    return loadPosts().find((post) => post.id === Number(id)) || null;
  }

  // 정렬된 목록에서 바로 앞(더 최신)과 뒤(더 예전) 글
  function getAdjacentPosts(id) {
    const posts = getPosts();
    const index = posts.findIndex((post) => post.id === Number(id));
    return {
      newer: index > 0 ? posts[index - 1] : null,
      older: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
    };
  }

  // [{ name: 'CSS', count: 2 }, ...]
  function getCategories() {
    const counts = {};
    loadPosts().forEach((post) => {
      counts[post.category] = (counts[post.category] || 0) + 1;
    });
    return Object.keys(counts)
      .sort()
      .map((name) => ({ name, count: counts[name] }));
  }

  function getTags() {
    const tags = new Set();
    loadPosts().forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }

  function getRecentPosts(limit) {
    return getPosts().slice(0, limit);
  }

  function getPopularPosts(limit) {
    return loadPosts()
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  /**
   * 글 저장 (id가 없으면 새 글, 있으면 수정)
   * 저장된 글을 돌려주고, 용량 초과 등으로 실패하면 null
   */
  function savePost(data) {
    const posts = loadPosts();
    const now = new Date().toISOString();
    let post;

    if (data.id) {
      post = posts.find((p) => p.id === Number(data.id));
      if (!post) return null;
      Object.assign(post, {
        title: data.title,
        category: data.category,
        tags: data.tags,
        content: data.content,
        thumbnail: data.thumbnail,
        updatedAt: now,
      });
    } else {
      const nextId = posts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      post = {
        id: nextId,
        title: data.title,
        category: data.category,
        tags: data.tags,
        content: data.content,
        thumbnail: data.thumbnail,
        createdAt: now,
        views: 0,
        likes: 0,
      };
      posts.push(post);
    }

    return savePosts(posts) ? post : null;
  }

  function deletePost(id) {
    const posts = loadPosts().filter((post) => post.id !== Number(id));
    return savePosts(posts);
  }

  function increaseViews(id) {
    const posts = loadPosts();
    const post = posts.find((p) => p.id === Number(id));
    if (!post) return;
    post.views += 1;
    savePosts(posts);
  }

  return {
    getPosts,
    getPost,
    getAdjacentPosts,
    getCategories,
    getTags,
    getRecentPosts,
    getPopularPosts,
    savePost,
    deletePost,
    increaseViews,
  };
})();
