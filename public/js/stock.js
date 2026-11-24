// Stock list page: list, find, filter and low stock report
async function loadStock() {
  // keep what was typed in the search boxes
  document.getElementById('find').value = getQuery('find');
  document.getElementById('filter').value = getQuery('filter');

  const params = new URLSearchParams();
  ['find', 'filter', 'report'].forEach((name) => { if (getQuery(name)) params.set(name, getQuery(name)); });

  try {
    const data = await getJson('/api/stock?' + params.toString());
    document.getElementById('heading').textContent = data.heading;
    document.getElementById('count').textContent = `(${data.count})`;
    showBox('message', takeFlash() || data.message);

    document.getElementById('rows').innerHTML = data.products.map((p) => `
      <tr>
        <td>${p.ProductNo}</td>
        <td>${escapeHtml(p.ProductName)}${hazardBadge(p.HazardWarning)}</td>
        <td>${escapeHtml(p.Category)}</td>
        <td class="num">${money(p.Price)}</td>
        <td class="num ${p.QuantityInStock <= data.lowStockLevel ? 'low' : ''}">${p.QuantityInStock}</td>
        <td>${ukDate(p.DateAdded)}</td>
        <td><span class="tag ${p.Available ? 'yes' : 'no'}">${p.Available ? 'Yes' : 'No'}</span></td>
        <td>
          <a class="btn small secondary" href="stock-edit.html?no=${p.ProductNo}">Edit</a>
          <a class="btn small danger" href="stock-delete.html?no=${p.ProductNo}">Delete</a>
          ${p.Available ? '' : `<button class="btn small" type="button" onclick="makeAvailable(${p.ProductNo})">Make available</button>`}
        </td>
      </tr>`).join('');
  } catch (err) {
    showBox('message', err.message);
  }
}
// one click to put an unavailable product back on the website:
// loads the product, sets Available to true and saves it with the normal update (so it is validated and logged)
async function makeAvailable(productNo) {
  try {
    const p = await getJson('/api/stock/' + productNo);
    const result = await sendJson('PUT', '/api/stock/' + productNo, {
      ProductName: p.ProductName,
      Category: p.Category,
      Price: String(p.Price),
      QuantityInStock: String(p.QuantityInStock),
      DateAdded: p.DateAdded,
      Available: true,
      HazardWarning: p.HazardWarning || ''
    });
    setFlash(result.message.replace('updated', 'is available on the website again'));
    window.location.reload();
  } catch (err) {
    showBox('message', err.message);
  }
}

loadStock();
