const API = "/api/clients";

const rows = document.getElementById("clientRows");
const form = document.getElementById("clientForm");
const panel = document.getElementById("formPanel");
const message = document.getElementById("message");

let clients = [];

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function showMessage(text, error = false) {
  message.textContent = text;
  message.style.color = error ? "#b91c1c" : "#166534";
}

async function loadClients() {
  try {
    clients = await request(API);
    renderClients();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderClients() {
  const search = document.getElementById("search").value.toLowerCase();
  const filtered = clients.filter(c =>
    c.fullName.toLowerCase().includes(search) ||
    c.email.toLowerCase().includes(search)
  );

  document.getElementById("total").textContent = clients.length;
  document.getElementById("active").textContent =
    clients.filter(c => c.isActive).length;
  document.getElementById("inactive").textContent =
    clients.filter(c => !c.isActive).length;

  rows.replaceChildren();

  filtered.forEach(client => {
    const tr = document.createElement("tr");

    const addCell = value => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
      return td;
    };

    addCell(client.clientId);

    const nameCell = addCell(client.fullName);
    const email = document.createElement("small");
    email.textContent = client.email;
    nameCell.appendChild(email);

    addCell(client.phone);
    addCell(client.registrationDate);

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = client.isActive ? "status" : "status off";
    status.textContent = client.isActive ? "Active" : "Inactive";
    statusCell.appendChild(status);
    tr.appendChild(statusCell);

    const actions = document.createElement("td");

    const edit = document.createElement("button");
    edit.className = "small";
    edit.textContent = "Edit";
    edit.onclick = () => editClient(client.clientId);

    const toggle = document.createElement("button");
    toggle.className = "small secondary";
    toggle.textContent = client.isActive ? "Deactivate" : "Activate";
    toggle.onclick = () => toggleStatus(client);

    actions.append(edit, toggle);
    tr.appendChild(actions);
    rows.appendChild(tr);
  });

  document.getElementById("empty").hidden = filtered.length > 0;
}

function openForm() {
  form.reset();
  document.getElementById("clientId").value = "";
  document.getElementById("formTitle").textContent = "Add Client";
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth" });
}

function editClient(id) {
  const client = clients.find(c => c.clientId === id);
  if (!client) return;

  document.getElementById("clientId").value = client.clientId;
  document.getElementById("fullName").value = client.fullName;
  document.getElementById("email").value = client.email;
  document.getElementById("phone").value = client.phone;
  document.getElementById("address").value = client.address;
  document.getElementById("formTitle").textContent = "Edit Client";

  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth" });
}

async function toggleStatus(client) {
  const action = client.isActive ? "deactivate" : "activate";
  if (!confirm(`Do you want to ${action} ${client.fullName}?`)) return;

  try {
    await request(`${API}/${client.clientId}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !client.isActive })
    });
    showMessage("Client status updated");
    await loadClients();
  } catch (error) {
    showMessage(error.message, true);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("clientId").value;
  const client = {
    fullName: document.getElementById("fullName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value
  };

  try {
    await request(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(client)
    });

    panel.hidden = true;
    showMessage(id ? "Client updated" : "Client registered");
    await loadClients();
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById("newClient").onclick = openForm;
document.getElementById("cancel").onclick = () => {
  panel.hidden = true;
};
document.getElementById("search").oninput = renderClients;

loadClients();

