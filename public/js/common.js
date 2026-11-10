// Shared helpers used by every page

// reads a value from the page address, e.g. ?no=3
function getQuery(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

// calls the server and returns the JSON reply; throws with the server's error message
async function sendJson(method, url, body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  const data = await response.json();
  if (response.status === 401 && !url.endsWith('/login')) {
    window.location.href = 'login.html';
  }
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function getJson(url) { return sendJson('GET', url); }

// shows or hides a message box
function showBox(id, text) {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = text || '';
  box.hidden = !text;
}

// stops HTML in product names from being run as code
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// formats 2.5 as £2.50 and 2026-10-05 as 05/10/2026
function money(value) { return '£' + Number(value).toFixed(2); }
function ukDate(value) { const [y, m, d] = value.split('-'); return `${d}/${m}/${y}`; }

// message passed from one page to the next (e.g. "Product 11 added.")
function setFlash(text) { sessionStorage.setItem('flash', text); }
function takeFlash() { const t = sessionStorage.getItem('flash'); sessionStorage.removeItem('flash'); return t; }

// log out link in the header
document.addEventListener('DOMContentLoaded', () => {
  const logout = document.getElementById('logout');
  if (logout) {
    logout.addEventListener('click', async (e) => {
      e.preventDefault();
      await sendJson('POST', '/api/logout');
      window.location.href = 'login.html';
    });
  }
});
