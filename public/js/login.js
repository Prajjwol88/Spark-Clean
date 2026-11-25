// Staff login page
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const result = await sendJson('POST', '/api/login', {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    });
    // managers go to the main menu; ordinary staff go to their own details page
    window.location.href = result.isManager ? 'menu.html' : 'my-details.html';
  } catch (err) {
    showBox('error', err.message);
  }
});
