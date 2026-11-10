// Staff login page
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await sendJson('POST', '/api/login', {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    });
    window.location.href = 'menu.html';
  } catch (err) {
    showBox('error', err.message);
  }
});
