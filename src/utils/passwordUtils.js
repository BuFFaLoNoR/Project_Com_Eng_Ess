const crypto = require('crypto');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, salt) => {
      if (err) return reject(err);

      salt = salt.toString('hex');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);

        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  });
}

function verifyPassword(storedPassword, password) {
  return new Promise((resolve, reject) => {
    const [salt, hashed] = storedPassword.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);

      resolve(hashed === derivedKey.toString('hex'));
    });
  });
}

module.exports = { hashPassword, verifyPassword };
