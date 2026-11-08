// Сторінка користувача
const session = Session.require('user');

if (session) {
  document.getElementById('who').textContent = session.login;
  document.getElementById('hello').textContent = 'Вітаємо, ' + session.name + '!';
  document.getElementById('logout').addEventListener('click', () => {
    Session.clear();
    location.href = 'index.html';
  });
}
