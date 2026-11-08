// Логіка сторінки авторизації та реєстрації
const $ = id => document.getElementById(id);

const loginForm = $('loginForm');
const registerForm = $('registerForm');

// Перемикання вкладок «Вхід» / «Реєстрація»
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    loginForm.classList.toggle('hidden', !isLogin);
    registerForm.classList.toggle('hidden', isLogin);
  });
});

// CheckBox «Показати пароль»
$('loginShow').addEventListener('change', e => {
  $('loginPass').type = e.target.checked ? 'text' : 'password';
});
$('regShow').addEventListener('change', e => {
  const type = e.target.checked ? 'text' : 'password';
  $('regPass').type = type;
  $('regPass2').type = type;
});

function showMsg(el, text, ok) {
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'bad');
}

function setError(id, text) {
  const input = $(id);
  const err = document.querySelector(`.err[data-for="${id}"]`);
  err.textContent = text || '';
  input.classList.toggle('invalid', Boolean(text));
  return !text;
}

// Перевірка полів реєстрації, у т.ч. збіг і складність паролів
async function validateRegistration(data) {
  let ok = true;
  ok &= setError('regName', data.name.split(/\s+/).filter(Boolean).length >= 2
    ? '' : 'Вкажіть прізвище та ім\'я');

  let loginErr = '';
  if (!/^[A-Za-z0-9_]{3,20}$/.test(data.login)) {
    loginErr = 'Від 3 до 20 символів: латиниця, цифри, _';
  } else if (await AdminDB.getAdmin(data.login.toLowerCase()) || await UserStore.findByLogin(data.login)) {
    loginErr = 'Такий логін уже зайнятий';
  }
  ok &= setError('regLogin', loginErr);

  ok &= setError('regEmail', /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(data.email)
    ? '' : 'Некоректна адреса пошти');
  ok &= setError('regPhone', /^\+380\d{9}$/.test(data.phone)
    ? '' : 'Формат: +380XXXXXXXXX');

  let passErr = '';
  if (data.password.length < 8) passErr = 'Пароль має містити щонайменше 8 символів';
  else if (!/[A-ZА-ЯІЇЄҐ]/.test(data.password)) passErr = 'Додайте хоча б одну велику літеру';
  else if (!/\d/.test(data.password)) passErr = 'Додайте хоча б одну цифру';
  ok &= setError('regPass', passErr);
  ok &= setError('regPass2', data.password === data.password2 ? '' : 'Паролі не збігаються');
  return Boolean(ok);
}

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    name: $('regName').value.trim(),
    login: $('regLogin').value.trim(),
    email: $('regEmail').value.trim(),
    phone: $('regPhone').value.trim(),
    password: $('regPass').value,
    password2: $('regPass2').value
  };
  const msg = $('regMsg');
  if (!(await validateRegistration(data))) {
    showMsg(msg, 'Виправте помилки у формі', false);
    return;
  }
  // Перед збереженням у LocalStorage дані шифруються (AES-GCM)
  await UserStore.add({
    name: data.name,
    login: data.login,
    email: data.email,
    phone: data.phone,
    password: data.password,
    registered: new Date().toLocaleString('uk-UA')
  });
  registerForm.reset();
  showMsg(msg, 'Реєстрація успішна! Дані збережено в зашифрованому вигляді. Тепер увійдіть.', true);
});

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const login = $('loginName').value.trim();
  const password = $('loginPass').value;
  const msg = $('loginMsg');
  if (!login || !password) {
    showMsg(msg, 'Введіть логін і пароль', false);
    return;
  }
  const admin = await AdminDB.checkAdmin(login.toLowerCase(), password);
  if (admin) {
    Session.set({ role: 'admin', login: admin.login, name: admin.name });
    location.href = 'admin.html';
    return;
  }
  const user = await UserStore.findByLogin(login);
  if (user && user.password === password) {
    Session.set({ role: 'user', login: user.login, name: user.name });
    location.href = 'user.html';
    return;
  }
  showMsg(msg, 'Невірний логін або пароль', false);
});
