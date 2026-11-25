// Staff Management page: list, find, search, filter, add, edit, activate/deactivate and delete staff
const API = '/api/staff';

const tableBody = document.getElementById('staffTable');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const modalBackdrop = document.getElementById('modalBackdrop');
const staffForm = document.getElementById('staffForm');

let staffList = [];        // the staff members shown in the table
let editingStaffNo = null; // staff number being edited, or null when adding

// formats 145 as 145.00 DKK
function dkk(value) { return Number(value).toFixed(2) + ' DKK'; }

// loads the table; a number in the search box finds one staff member, text searches name or email
async function loadStaff() {
  const search = searchInput.value.trim();
  const params = new URLSearchParams();
  if (/^\d+$/.test(search)) {
    params.set('find', search);
  } else {
    if (search) params.set('search', search);
    if (statusFilter.value !== 'all') params.set('status', statusFilter.value);
  }

  try {
    const data = await getJson(API + '?' + params.toString());
    staffList = data.staff;
    document.getElementById('totalAll').textContent = data.totals.all;
    document.getElementById('totalActive').textContent = data.totals.active;
    document.getElementById('totalInactive').textContent = data.totals.inactive;
    document.getElementById('heading').textContent = data.heading;
    document.getElementById('count').textContent = `(${data.count})`;
    const flash = takeFlash();
    showBox('message', flash || data.message);
    renderStaff();
  } catch (err) {
    showBox('message', err.message);
  }
}

// draws one table row per staff member (escapeHtml stops HTML in names being run)
function renderStaff() {
  tableBody.innerHTML = staffList.map((s) => `
    <tr>
      <td>${s.StaffNo}</td>
      <td>${escapeHtml(s.FullName)}<small>${escapeHtml(s.Email)}${s.Phone ? ' · ' + escapeHtml(s.Phone) : ''}</small></td>
      <td>${escapeHtml(s.JobRole)}</td>
      <td>${ukDate(s.StartDate)}</td>
      <td class="num">${dkk(s.HourlyRate)}</td>
      <td>${s.IsManager ? 'Yes' : 'No'}</td>
      <td><span class="status ${s.Active ? '' : 'inactive'}">${s.Active ? 'Active' : 'Inactive'}</span></td>
      <td class="actions">
        <button type="button" class="secondary" data-action="edit" data-no="${s.StaffNo}">Edit</button>
        <button type="button" class="${s.Active ? 'danger' : 'secondary'}" data-action="toggle" data-no="${s.StaffNo}">${s.Active ? 'Deactivate' : 'Activate'}</button>
        ${s.Active ? '' : `<button type="button" class="danger" data-action="delete" data-no="${s.StaffNo}">Delete</button>`}
      </td>
    </tr>`).join('');
}

// one click handler for every button in the table
tableBody.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  const staff = staffList.find((s) => s.StaffNo === Number(button.dataset.no));
  if (!staff) return;
  if (button.dataset.action === 'edit') openForm(staff);
  if (button.dataset.action === 'toggle') toggleStatus(staff);
  if (button.dataset.action === 'delete') deleteStaff(staff);
});

// opens the pop-up form, empty for a new staff member or filled in for editing
function openForm(staff = null) {
  staffForm.reset();
  showBox('formError', '');
  editingStaffNo = staff ? staff.StaffNo : null;
  document.getElementById('modalTitle').textContent = staff ? `Edit staff member ${staff.StaffNo}` : 'Add staff member';

  if (staff) {
    staffForm.FullName.value = staff.FullName;
    staffForm.Email.value = staff.Email;
    staffForm.Phone.value = staff.Phone;
    staffForm.JobRole.value = staff.JobRole;
    staffForm.StartDate.value = staff.StartDate;
    staffForm.HourlyRate.value = Number(staff.HourlyRate).toFixed(2);
    staffForm.IsManager.value = staff.IsManager ? 'yes' : 'no';
  } else {
    staffForm.StartDate.value = todayText();
  }

  modalBackdrop.classList.add('open');
  staffForm.FullName.focus();
}

function closeForm() {
  modalBackdrop.classList.remove('open');
  editingStaffNo = null;
}

// today's date as yyyy-mm-dd for a new staff member
function todayText() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// saves the form (Add or Update); the server checks it with clsStaff.Valid first
staffForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const staff = {
    FullName: staffForm.FullName.value,
    Email: staffForm.Email.value,
    Phone: staffForm.Phone.value,
    JobRole: staffForm.JobRole.value,
    StartDate: staffForm.StartDate.value,
    HourlyRate: staffForm.HourlyRate.value,
    IsManager: staffForm.IsManager.value === 'yes'
  };
  try {
    const result = editingStaffNo
      ? await sendJson('PUT', `${API}/${editingStaffNo}`, staff)
      : await sendJson('POST', API, staff);
    closeForm();
    setFlash(result.message);
    await loadStaff();
  } catch (err) {
    showBox('formError', err.message);
  }
});

// activates or deactivates a staff member
async function toggleStatus(staff) {
  const action = staff.Active ? 'deactivate' : 'activate';
  if (!confirm(`Do you want to ${action} ${staff.FullName} (${staff.StaffNo})?`)) return;
  try {
    const result = await sendJson('PATCH', `${API}/${staff.StaffNo}`, { Active: !staff.Active });
    setFlash(result.message);
    await loadStaff();
  } catch (err) {
    showBox('message', err.message);
  }
}

// deletes an inactive staff member (the server refuses to delete active staff)
async function deleteStaff(staff) {
  if (!confirm(`Permanently delete ${staff.FullName} (${staff.StaffNo})? This cannot be undone.`)) return;
  try {
    const result = await sendJson('DELETE', `${API}/${staff.StaffNo}`);
    setFlash(result.message);
    await loadStaff();
  } catch (err) {
    showBox('message', err.message);
  }
}

// search waits until typing stops for a moment, so the server is not called on every key
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadStaff, 250);
});
statusFilter.addEventListener('change', loadStaff);
document.getElementById('addButton').addEventListener('click', () => openForm());
document.getElementById('cancelButton').addEventListener('click', closeForm);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeForm(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) closeForm(); });

loadStaff();
