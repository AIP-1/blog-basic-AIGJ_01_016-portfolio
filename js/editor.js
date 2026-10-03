/**
 * WYSIWYG 에디터
 * contenteditable 영역 + 툴바 버튼으로 서식을 넣는다.
 *
 * 사용법:
 *   const editor = createEditor(document.getElementById('editor'), document.getElementById('toolbar'));
 *   editor.getHTML();          // 본문 HTML 꺼내기
 *   editor.setHTML('<p>..</p>');
 */
function createEditor(area, toolbar) {
  const IMAGE_MAX_WIDTH = 1200; // 이미지 저장 용량을 줄이기 위해 이 너비로 줄여서 넣는다
  let savedRange = null;

  area.contentEditable = 'true';
  document.execCommand('defaultParagraphSeparator', false, 'p');
  document.execCommand('styleWithCSS', false, true); // 글자색 등을 <font> 대신 style로

  // ----- 선택 영역 기억하기 -----
  // 색상 선택창이나 드롭다운을 누르면 에디터의 선택이 풀리므로 미리 저장해 두었다가 되살린다
  function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount && area.contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    area.focus();
    if (!savedRange) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  function run(command, value) {
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    updateToolbar();
    updateEmptyState();
  }

  // ----- 툴바 상태 (현재 커서 위치가 굵게인지 등) -----
  const stateCommands = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList', 'justifyLeft', 'justifyCenter', 'justifyRight'];
  const blockSelect = toolbar.querySelector('[data-block]');

  function updateToolbar() {
    stateCommands.forEach((cmd) => {
      const btn = toolbar.querySelector(`[data-command="${cmd}"]`);
      if (btn) btn.classList.toggle('is-active', document.queryCommandState(cmd));
    });
    const block = String(document.queryCommandValue('formatBlock')).toLowerCase().replace(/[<>]/g, '');
    if (blockSelect) {
      blockSelect.value = ['h2', 'h3', 'h4'].includes(block) ? block : 'p';
    }
  }

  // 비어 있으면 안내 문구를 보여 주기 위한 클래스
  function updateEmptyState() {
    const empty = !area.textContent.trim() && !area.querySelector('img, hr');
    area.classList.toggle('is-empty', empty);
  }

  // ----- 이미지 넣기 -----
  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          // GIF는 움직임이 사라지지 않도록 그대로 둔다
          if (file.type === 'image/gif' || img.width <= IMAGE_MAX_WIDTH) {
            resolve(reader.result);
            return;
          }
          const canvas = document.createElement('canvas');
          canvas.width = IMAGE_MAX_WIDTH;
          canvas.height = Math.round(img.height * (IMAGE_MAX_WIDTH / img.width));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/png, image/jpeg, image/gif, image/webp';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    try {
      run('insertImage', await resizeImage(file));
    } catch (e) {
      alert('이미지를 불러오지 못했습니다.');
    }
  });

  function insertLink() {
    const url = prompt('링크 주소를 입력하세요', 'https://');
    if (!url || url === 'https://') return;
    if (!/^(https?:|mailto:)/i.test(url)) {
      alert('http:// 또는 https:// 로 시작하는 주소만 넣을 수 있습니다.');
      return;
    }
    // prompt 창이 뜨면 선택이 풀리므로 저장해 둔 선택 영역으로 판단한다
    if (!savedRange || savedRange.collapsed) {
      // 선택한 글자가 없으면 주소 자체를 링크 글자로 넣는다
      const a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      run('insertHTML', a.outerHTML);
    } else {
      run('createLink', url);
    }
  }

  // ----- 툴바 이벤트 -----
  // 버튼을 눌러도 에디터의 선택(파란 영역)이 풀리지 않게 한다
  toolbar.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) e.preventDefault();
  });

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const { command, action } = btn.dataset;
    if (command) run(command, btn.dataset.value);
    if (action === 'link') insertLink();
    if (action === 'image') { saveSelection(); fileInput.click(); }
    if (action === 'quote') run('formatBlock', '<blockquote>');
    if (action === 'code') run('formatBlock', '<pre>');
  });

  if (blockSelect) {
    blockSelect.addEventListener('change', () => run('formatBlock', `<${blockSelect.value}>`));
  }

  const colorInput = toolbar.querySelector('[data-color]');
  if (colorInput) {
    colorInput.addEventListener('input', () => run('foreColor', colorInput.value));
  }

  // ----- 에디터 이벤트 -----
  document.addEventListener('selectionchange', () => {
    if (area.contains(window.getSelection().anchorNode)) {
      saveSelection();
      updateToolbar();
    }
  });

  area.addEventListener('input', updateEmptyState);

  // 다른 사이트에서 복사한 글은 지저분한 서식이 따라오므로 허용한 태그만 남겨 붙인다
  area.addEventListener('paste', (e) => {
    const html = e.clipboardData.getData('text/html');
    if (!html) return; // 일반 글자는 브라우저 기본 동작대로
    e.preventDefault();
    run('insertHTML', sanitizeHTML(html));
  });

  // 비어 있을 때 첫 줄이 <p>로 시작하도록
  function ensureParagraph() {
    if (!area.innerHTML.trim()) area.innerHTML = '<p><br></p>';
  }

  ensureParagraph();
  updateEmptyState();

  return {
    getHTML() {
      return sanitizeHTML(area.innerHTML);
    },
    setHTML(html) {
      area.innerHTML = sanitizeHTML(html);
      ensureParagraph();
      updateEmptyState();
    },
    isEmpty() {
      return area.classList.contains('is-empty');
    },
    focus() {
      area.focus();
    },
  };
}
