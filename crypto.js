// Модуль шифрування: AES-GCM (256 біт) через Web Crypto API.
// Ключ виводиться з секретної фрази функцією PBKDF2 (SHA-256, 100 000 ітерацій).
const CryptoBox = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const SECRET = 'KAI-TECH-585KB-web-crypto';
  const SALT = enc.encode('585-KB-static-salt');
  let keyPromise = null;

  function getKey() {
    if (!keyPromise) {
      keyPromise = crypto.subtle
        .importKey('raw', enc.encode(SECRET), 'PBKDF2', false, ['deriveKey'])
        .then(base => crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: SALT, iterations: 100000, hash: 'SHA-256' },
          base,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        ));
    }
    return keyPromise;
  }

  const toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const fromB64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));

  // Шифрує об'єкт: повертає випадковий вектор ініціалізації та шифротекст у Base64
  async function encrypt(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = enc.encode(JSON.stringify(obj));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getKey(), plain);
    return { iv: toB64(iv), data: toB64(cipher) };
  }

  // Розшифровує запис {iv, data} і повертає вихідний об'єкт
  async function decrypt(record) {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(record.iv) },
      await getKey(),
      fromB64(record.data)
    );
    return JSON.parse(dec.decode(plain));
  }

  // Хеш SHA-256 у шістнадцятковому вигляді (для пароля адміністратора)
  async function sha256(text) {
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return { encrypt, decrypt, sha256 };
})();
