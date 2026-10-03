/**
 * 글쓰기 / 글 수정
 * admin/write.html        → 새 글
 * admin/write.html?id=3   → 3번 글 수정
 */
const form = document.getElementById('write-form');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const tagsInput = document.getElementById('tags');
const editor = createEditor(document.getElementById('editor'), document.getElementById('toolbar'));

const editId = new URLSearchParams(location.search).get('id');
let isDirty = false;

// 기존 카테고리를 입력창 추천 목록으로
document.getElementById('category-list').innerHTML = Store.getCategories()
  .map((c) => `<option value="${c.name.replace(/"/g, '&quot;')}"></option>`)
  .join('');

if (editId) {
  const post = Store.getPost(editId);
  if (post) {
    document.title = '글 수정';
    document.getElementById('submit-button').textContent = '수정 완료';
    titleInput.value = post.title;
    categoryInput.value = post.category;
    tagsInput.value = post.tags.join(', ');
    editor.setHTML(post.content);
  } else {
    alert('수정할 글을 찾을 수 없습니다. 새 글 쓰기로 이동합니다.');
    location.replace('write.html');
  }
}

function parseTags(text) {
  const tags = text
    .split(',')
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter(Boolean);
  return Array.from(new Set(tags));
}

form.addEventListener('input', () => { isDirty = true; });

// 입력칸에서 Enter를 눌러 실수로 발행되지 않도록 막는다 (제목에서는 본문으로 이동)
form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || e.isComposing) return;
  e.preventDefault();
  if (e.target === titleInput) editor.focus();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    alert('제목을 입력하세요.');
    titleInput.focus();
    return;
  }
  if (editor.isEmpty()) {
    alert('본문을 입력하세요.');
    editor.focus();
    return;
  }

  const content = editor.getHTML();
  const saved = Store.savePost({
    id: editId,
    title,
    category: categoryInput.value.trim() || '미분류',
    tags: parseTags(tagsInput.value),
    content,
    thumbnail: findFirstImage(content),
  });

  if (!saved) {
    alert('저장하지 못했습니다.\n이미지가 너무 많거나 커서 저장 공간(약 5MB)을 넘었을 수 있습니다.');
    return;
  }

  isDirty = false;
  location.href = `../post.html?id=${saved.id}`;
});

document.getElementById('cancel-button').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.href = '../blog.html';
});

// 저장하지 않고 나가려 할 때 경고
window.addEventListener('beforeunload', (e) => {
  if (!isDirty) return;
  e.preventDefault();
  e.returnValue = '';
});
