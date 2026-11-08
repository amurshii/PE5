// База даних адміністраторів (IndexedDB) та сховище користувачів (LocalStorage)

const AdminDB = (() => {
  const DB_NAME = 'CryptoWebDB';
  const STORE = 'admins';
  const VERSION = 1;
  // Пароль адміністратора зберігається лише у вигляді хешу SHA-256 від "логін:пароль"
  const SEED = [{
    login: 'admin',
    name: 'Адміністратор системи',
    passwordHash: '257ddc163fa4adab578ea8b65a06c34d8da744be3bc00daa997f0775c650fb2b'
  }];

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'login' });
        SEED.forEach(admin => store.put(admin));
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAdmin(login) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(login);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function checkAdmin(login, password) {
    const admin = await getAdmin(login);
    if (!admin) return null;
    const hash = await CryptoBox.sha256(login + ':' + password);
    return hash === admin.passwordHash ? admin : null;
  }

  return { getAdmin, checkAdmin };
})();

const UserStore = {
  KEY: 'encryptedUsers',

  readRaw() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  writeRaw(list) {
    localStorage.setItem(this.KEY, JSON.stringify(list));
  },

  // Повертає всіх користувачів у розшифрованому вигляді
  async all() {
    const result = [];
    for (const rec of this.readRaw()) {
      try {
        const user = await CryptoBox.decrypt(rec);
        result.push({ id: rec.id, ...user });
      } catch (e) {
        console.warn('Не вдалося розшифрувати запис', rec.id);
      }
    }
    return result;
  },

  async findByLogin(login) {
    const users = await this.all();
    return users.find(u => u.login.toLowerCase() === login.toLowerCase()) || null;
  },

  // Шифрує дані користувача перед записом у LocalStorage
  async add(user) {
    const list = this.readRaw();
    const encrypted = await CryptoBox.encrypt(user);
    list.push({ id: crypto.randomUUID(), ...encrypted });
    this.writeRaw(list);
  },

  remove(id) {
    this.writeRaw(this.readRaw().filter(r => r.id !== id));
  }
};

const Session = {
  set(data) { sessionStorage.setItem('session', JSON.stringify(data)); },
  get() {
    try { return JSON.parse(sessionStorage.getItem('session')); } catch (e) { return null; }
  },
  clear() { sessionStorage.removeItem('session'); },
  // Не пускає на сторінку без потрібної ролі
  require(role) {
    const s = this.get();
    if (!s || s.role !== role) {
      location.replace('index.html');
      return null;
    }
    return s;
  }
};
