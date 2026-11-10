// Changes the Stock Manager password: npm run set-password -- YourNewPassword
// Saves only a salted hash in app.config.js, never the password itself.
const fs = require('fs');
const path = require('path');
const clsStaffLogin = require('../classes/clsStaffLogin');

const password = process.argv[2];
if (!password || password.length < 8) {
  console.log('Please give a password of at least 8 characters, e.g.  npm run set-password -- MyNewPass1');
  process.exit(1);
}
const file = path.join(__dirname, '..', 'app.config.js');
const text = fs.readFileSync(file, 'utf8')
  .replace(/passwordHash: '[^']*'/, `passwordHash: '${clsStaffLogin.HashPassword(password)}'`);
fs.writeFileSync(file, text);
console.log('Password changed. Restart the app (Ctrl+C, then npm start).');
