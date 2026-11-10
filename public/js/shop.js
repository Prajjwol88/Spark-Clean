// Customer shop page: shows only products that are available and in stock
async function loadShop() {
  const filter = getQuery('filter');
  document.getElementById('filter').value = filter;
  try {
    const data = await getJson('/api/shop?filter=' + encodeURIComponent(filter));
    showBox('message', data.message);
    document.getElementById('products').innerHTML = data.products.map((p) => `
      <div class="product">
        <div class="muted">${escapeHtml(p.Category)}</div>
        <h3>${escapeHtml(p.ProductName)}</h3>
        <div class="price">${money(p.Price)}</div>
        <div class="muted">${p.QuantityInStock} in stock</div>
      </div>`).join('');
  } catch (err) {
    showBox('message', err.message);
  }
}
loadShop();
