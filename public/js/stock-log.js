// Change log page (Sprint 5): shows who added, edited or deleted which product and when
const actionText = {
  Added: 'Added',
  Updated: 'Edited',
  Deleted: 'Deleted',
  MarkedUnavailable: 'Marked unavailable'
};

async function loadLog() {
  try {
    const data = await getJson('/api/stocklog');
    document.getElementById('count').textContent = `(${data.count})`;
    showBox('message', data.message);
    document.getElementById('rows').innerHTML = data.entries.map((e) => `
      <tr>
        <td>${e.LogNo}</td>
        <td>${escapeHtml(e.ChangedAt)}</td>
        <td><span class="tag ${e.Action === 'Added' || e.Action === 'Updated' ? 'yes' : 'no'}">${actionText[e.Action] || escapeHtml(e.Action)}</span></td>
        <td>${e.ProductNo}</td>
        <td>${escapeHtml(e.ProductName)}</td>
        <td>${escapeHtml(e.ChangedBy)}</td>
      </tr>`).join('');
  } catch (err) {
    showBox('message', err.message);
  }
}
loadLog();
