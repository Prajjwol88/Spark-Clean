// Add / edit product page (stock-edit.html for add, stock-edit.html?no=3 for edit)
const productNo = getQuery('no');
const form = document.getElementById('productForm');

// today's date as yyyy-mm-dd for a new product
function todayText() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function loadProduct() {
  if (!productNo) {
    form.DateAdded.value = todayText();
    return;
  }
  document.getElementById('title').textContent = 'Edit product ' + productNo;
  try {
    const p = await getJson('/api/stock/' + productNo);
    form.ProductName.value = p.ProductName;
    form.Category.value = p.Category;
    form.Price.value = Number(p.Price).toFixed(2);
    form.QuantityInStock.value = p.QuantityInStock;
    form.DateAdded.value = p.DateAdded;
    form.Available.checked = p.Available;
    form.HazardWarning.value = p.HazardWarning || '';
  } catch (err) {
    showBox('error', err.message);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const product = {
    ProductName: form.ProductName.value,
    Category: form.Category.value,
    Price: form.Price.value,
    QuantityInStock: form.QuantityInStock.value,
    DateAdded: form.DateAdded.value,
    Available: form.Available.checked,
    HazardWarning: form.HazardWarning.value
  };
  try {
    // the server checks the data with clsStock.Valid before saving
    const result = productNo
      ? await sendJson('PUT', '/api/stock/' + productNo, product)
      : await sendJson('POST', '/api/stock', product);
    setFlash(result.message);
    window.location.href = 'stock.html';
  } catch (err) {
    showBox('error', err.message);
  }
});

loadProduct();
