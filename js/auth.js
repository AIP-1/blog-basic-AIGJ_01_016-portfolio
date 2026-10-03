/**
 * 회원가입 · 로그인
 * 서버가 없으므로 회원 정보를 localStorage에 저장하는 연습용 로그인이다.
 * 비밀번호는 그대로 저장하지 않고 해시(SHA-256)로 바꿔서 저장한다.
 * 나중에 서버(Firebase Auth 등)로 바꿀 때는 이 파일만 고치면 된다.
 */
const Auth = (function () {
  const USERS_KEY = 'blog.users';
  const SESSION_KEY = 'blog.session';

  function read(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function randomSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function hashPassword(password, salt) {
    if (!window.crypto || !crypto.subtle) {
      throw new Error('이 환경에서는 비밀번호를 안전하게 처리할 수 없습니다. 파일을 직접 열거나 https 주소로 접속해 주세요.');
    }
    const data = new TextEncoder().encode(salt + password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function normalizeEmail(email) {
    return String(email).trim().toLowerCase();
  }

  function startSession(user) {
    write(SESSION_KEY, { email: user.email, nickname: user.nickname });
  }

  /**
   * 회원가입. 성공하면 바로 로그인 상태가 된다.
   * 돌려주는 값: { ok: true } 또는 { ok: false, message: '...' }
   */
  async function signUp({ nickname, email, password }) {
    const users = read(USERS_KEY, []);
    const normalized = normalizeEmail(email);

    if (users.some((user) => user.email === normalized)) {
      return { ok: false, message: '이미 가입된 이메일입니다.' };
    }

    const salt = randomSalt();
    const user = {
      email: normalized,
      nickname: nickname.trim(),
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };
    users.push(user);

    if (!write(USERS_KEY, users)) {
      return { ok: false, message: '저장 공간이 부족해 가입하지 못했습니다.' };
    }
    startSession(user);
    return { ok: true };
  }

  async function logIn(email, password) {
    const user = read(USERS_KEY, []).find((u) => u.email === normalizeEmail(email));
    // 이메일이 없는지 비밀번호가 틀린지 구분해서 알려 주지 않는다 (가입 여부를 숨기기 위해)
    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
      return { ok: false, message: '이메일 또는 비밀번호가 맞지 않습니다.' };
    }
    startSession(user);
    return { ok: true };
  }

  function logOut() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      // 무시
    }
  }

  // 로그인한 사용자 { email, nickname } 또는 null
  function currentUser() {
    return read(SESSION_KEY, null);
  }

  return { signUp, logIn, logOut, currentUser };
})();
