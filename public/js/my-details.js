// My Details page: a logged in staff member sees their own record
// and can change only their phone number and their password (Staff Management - Sushil)
const API = '/api/my-details';

// formats 145 as 145.00 DKK
function dkk(value) { return Number(value).toFixed(2) + ' DKK'; }

// loads and shows the logged in staff member's record
async function loadDetails() {
  try {
    const s = await getJson(API);
    document.getElementById('greeting').textContent = s.FullName;
    document.getElementById('phone').value = s.Phone;
    const rows = [
      ['Staff number', s.StaffNo],
      ['Full name', s.FullName],
      ['Email', s.Email],
      ['Phone', s.Phone || 'Not given'],
      ['Job role', s.JobRole],
      ['Start date', ukDate(s.StartDate)],
      ['Hourly rate', dkk(s.HourlyRate)],
      ['Manager', s.IsManager ? 'Yes' : 'No']
    ];
    // escapeHtml stops HTML in a name being run
    document.getElementById('details').innerHTML = rows
      .map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(String(value))}</dd>`)
      .join('');
  } catch (err) {
    showBox('message', err.message);
  }
}

// saves a new phone number
document.getElementById('phoneForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showBox('phoneError', '');
  try {
    const result = await sendJson('PUT', `${API}/phone`, { Phone: document.getElementById('phone').value });
    showBox('message', result.message);
    await loadDetails();
  } catch (err) {
    showBox('phoneError', err.message);
  }
});

// changes the password after checking the two new passwords match
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showBox('passwordError', '');
  const newPassword = document.getElementById('newPassword').value;
  if (newPassword !== document.getElementById('repeatPassword').value) {
    showBox('passwordError', 'The two new passwords are not the same.');
    return;
  }
  try {
    const result = await sendJson('PUT', `${API}/password`, {
      CurrentPassword: document.getElementById('currentPassword').value,
      NewPassword: newPassword
    });
    e.target.reset();
    showBox('message', result.message);
  } catch (err) {
    showBox('passwordError', err.message);
  }
});

loadDetails();
