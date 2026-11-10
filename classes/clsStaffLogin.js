// Middle layer: checks the login for the Stock Management page.
// Only the owner of this component (Bibek, Stock Manager) can log in.
// The password is never stored as plain text - only a salted scrypt hash is kept in app.config.js.
const crypto = require('crypto');
const config = require('../app.config');

class clsStaffLogin {
  // turns a password into "salt:hash" so it can be stored safely
  static HashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  // true if the password matches the stored "salt:hash"
  static CheckPassword(password, stored) {
    const [salt, hash] = String(stored || '').split(':');
    if (!salt || !hash) return false;
    const test = crypto.scryptSync(String(password || ''), salt, 64);
    const real = Buffer.from(hash, 'hex');
    return real.length === test.length && crypto.timingSafeEqual(real, test);
  }

  // true only for this component's own user
  static CheckLogin(username, password, account = config.owner) {
    const sameUser = String(username || '').trim().toLowerCase() === account.username.toLowerCase();
    const rightPassword = clsStaffLogin.CheckPassword(password, account.passwordHash);
    return sameUser && rightPassword;
  }
}

module.exports = clsStaffLogin;
