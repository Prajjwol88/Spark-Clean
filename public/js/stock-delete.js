// Delete confirmation page (stock-delete.html?no=3)
const productNo = getQuery('no');

async function loadProduct() {
  try {
    const p = await getJson('/api/stock/' + productNo);
    document.getElementById('productName').textContent = p.ProductName;
    document.getElementById('productNo').textContent = p.ProductNo;
  } catch (err) {
    showBox('error', err.message);
    document.getElementById('confirmDelete').disabled = true;
  }
}

document.getElementById('confirmDelete').addEventListener('click', async () => {
  try {
    const result = await sendJson('DELETE', '/api/stock/' + productNo);
    setFlash(result.message);
    window.location.href = 'stock.html';
  } catch (err) {
    showBox('error', err.message);
  }
});

loadProduct();
