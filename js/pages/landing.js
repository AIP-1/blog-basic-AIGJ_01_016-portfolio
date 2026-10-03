/**
 * 랜딩: '이리오너라'를 누르면 대문이 열리고 로그인 / 회원가입 창이 뜬다.
 *
 * 1) body.is-open      → 문짝 두 개가 안쪽으로 열린다
 * 2) body.is-entering  → 화면이 문 안으로 다가가듯 확대된다
 * 3) 로그인 창 표시
 * 닫을 때는 반대 순서로 돌아간다.
 */
const body = document.body;
const knock = document.getElementById('knock');
const doorway = document.querySelector('.doorway');
const panel = document.getElementById('auth-panel');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// CSS 전환 시간과 맞춘다. 움직임 줄이기 설정이면 기다리지 않는다.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DOOR_MS = reduceMotion ? 0 : 1100;
const ZOOM_MS = reduceMotion ? 0 : 700;

let timers = [];

function later(fn, ms) {
  timers.push(setTimeout(fn, ms));
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

// ----- 문 열기 / 닫기 -----
function openGate(tab) {
  if (body.classList.contains('is-open')) return;
  clearTimers();
  body.classList.add('is-open');

  later(() => {
    // 이미 로그인한 사람은 문이 열리면 바로 블로그로
    if (Auth.currentUser()) {
      location.href = 'blog.html';
      return;
    }
    body.classList.add('is-entering');
    later(() => showPanel(tab || 'login'), ZOOM_MS);
  }, DOOR_MS);
}

function closeGate() {
  clearTimers();
  hidePanel();
  body.classList.remove('is-entering');
  later(() => {
    body.classList.remove('is-open');
    knock.focus();
  }, ZOOM_MS);
}

function showPanel(tab) {
  panel.hidden = false; // 먼저 보이게 해야 입력칸에 커서를 둘 수 있다
  switchTab(tab);
  requestAnimationFrame(() => panel.classList.add('is-visible'));
}

function hidePanel() {
  panel.classList.remove('is-visible');
  panel.hidden = true;
}

knock.addEventListener('click', () => openGate());
doorway.addEventListener('click', () => openGate());
panel.querySelector('.auth-close').addEventListener('click', closeGate);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.hidden) closeGate();
});

// 창 바깥(어두운 배경)을 누르면 닫기
panel.addEventListener('click', (e) => {
  if (e.target === panel) closeGate();
});

// ----- 로그인 / 회원가입 탭 -----
function switchTab(name) {
  panel.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
  });
  loginForm.hidden = name !== 'login';
  signupForm.hidden = name !== 'signup';
  [loginForm, signupForm].forEach((form) => showError(form, ''));

  const form = name === 'login' ? loginForm : signupForm;
  form.querySelector('input').focus();
}

panel.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tab]');
  if (btn) switchTab(btn.dataset.tab);
});

// ----- 폼 처리 -----
function showError(form, message) {
  form.querySelector('.auth-error').textContent = message;
}

async function submitWith(form, action) {
  const button = form.querySelector('.auth-submit');
  button.disabled = true;
  try {
    const result = await action();
    if (result.ok) {
      location.href = 'blog.html';
    } else {
      showError(form, result.message);
    }
  } catch (err) {
    showError(form, err.message);
  } finally {
    button.disabled = false;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { email, password } = loginForm.elements;

  if (!EMAIL_PATTERN.test(email.value.trim())) return showError(loginForm, '이메일을 올바르게 입력하세요.');
  if (!password.value) return showError(loginForm, '비밀번호를 입력하세요.');

  submitWith(loginForm, () => Auth.logIn(email.value, password.value));
});

signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { nickname, email, password, passwordConfirm } = signupForm.elements;
  const name = nickname.value.trim();

  if (name.length < 2 || name.length > 12) return showError(signupForm, '닉네임은 2~12자로 입력하세요.');
  if (!EMAIL_PATTERN.test(email.value.trim())) return showError(signupForm, '이메일을 올바르게 입력하세요.');
  if (password.value.length < 8) return showError(signupForm, '비밀번호는 8자 이상이어야 합니다.');
  if (password.value !== passwordConfirm.value) return showError(signupForm, '비밀번호 확인이 일치하지 않습니다.');

  submitWith(signupForm, () => Auth.signUp({
    nickname: name,
    email: email.value,
    password: password.value,
  }));
});

// 블로그 헤더의 '로그인' 링크(index.html?auth=login)로 들어오면 바로 문을 연다
const requested = new URLSearchParams(location.search).get('auth');
if (requested === 'login' || requested === 'signup') {
  later(() => openGate(requested), 400);
}
