// Сторінка адміністратора: читання LocalStorage, дешифрування, побудова таблиці
const session = Session.require('admin');

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

async function render() {
  const users = await UserStore.all();
  const showPass = document.getElementById('showPass').checked;
  const body = document.getElementById('usersBody');
  document.getElementById('count').textContent = users.length;

  body.innerHTML = users.length ? users.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.login)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone)}</td>
      <td class="mono">${showPass ? escapeHtml(u.password) : '••••••••'}</td>
      <td>${escapeHtml(u.registered)}</td>
      <td><button class="btn btn--danger btn--small" data-id="${u.id}">Видалити</button></td>
    </tr>`).join('')
    : '<tr><td colspan="8" class="empty">Користувачів ще немає</td></tr>';

  document.getElementById('raw').textContent =
    JSON.stringify(UserStore.readRaw(), null, 2) || '[]';
}

if (session) {
  document.getElementById('who').textContent = session.name + ' (' + session.login + ')';
  document.getElementById('logout').addEventListener('click', () => {
    Session.clear();
    location.href = 'index.html';
  });
  document.getElementById('showPass').addEventListener('change', render);
  document.getElementById('usersBody').addEventListener('click', e => {
    const id = e.target.dataset.id;
    if (id && confirm('Видалити користувача?')) {
      UserStore.remove(id);
      render();
    }
  });
  render();
}
