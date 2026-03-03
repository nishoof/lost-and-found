import "./styles.css";

const app = document.querySelector("#app");

const state = {
  items: [],
  editingId: null
};

const apiBase = import.meta.env.VITE_API_BASE || "";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const render = () => {
  const itemsHtml = state.items.length
    ? state.items
      .map((item) => {
        const isEditing = state.editingId === item.id;
        const description = item.description || "";
        const descriptionHtml = isEditing
          ? `<textarea data-role="description">${escapeHtml(description)}</textarea>
                <div class="edit-actions">
                  <button class="primary" data-action="save">Save</button>
                </div>`
          : escapeHtml(description || "No description");

        return `
          <div class="item" data-id="${item.id}">
            <div class="item-header">
              <div class="item-name">${escapeHtml(item.name)}</div>
              <div class="item-actions">
                <button class="secondary" data-action="edit">
                  ${isEditing ? "Cancel" : "Edit"}
                </button>
                <button class="danger" data-action="delete">Remove</button>
              </div>
            </div>
            <div class="item-description">${descriptionHtml}</div>
          </div>
        `;
      })
      .join("")
    : `<div class="empty">No lost items yet.</div>`;

  app.innerHTML = `
    <header>
      <h1>Lost & Found</h1>
      <p>Create a listing and update the description if needed. Remove it once found.</p>
    </header>

    <section class="card">
      <form id="create-form">
        <div class="form-field">
          <label for="name">Item name</label>
          <input id="name" name="name" type="text" placeholder="Wallet, keys, backpack" required />
        </div>
        <div class="form-field">
          <label for="description">Description (optional)</label>
          <textarea id="description" name="description" placeholder="Color, brand, where you last saw it"></textarea>
        </div>
        <button class="primary" type="submit" id="submit-btn" disabled>Add Item</button>
      </form>
    </section>

    <section class="card">
      <div class="items">${itemsHtml}</div>
    </section>
  `;

  wireForm();
  wireItemActions();
};

const wireForm = () => {
  const form = document.querySelector("#create-form");
  const nameInput = form.querySelector("#name");
  const descriptionInput = form.querySelector("#description");
  const submitButton = form.querySelector("#submit-btn");

  const toggleSubmit = () => {
    submitButton.disabled = !nameInput.value.trim();
  };

  nameInput.addEventListener("input", toggleSubmit);
  toggleSubmit();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const item = {
      name: nameInput.value.trim(),
      description: descriptionInput.value.trim()
    };

    if (!item.name) {
      return;
    }

    await createItem(item);
    nameInput.value = "";
    descriptionInput.value = "";
    toggleSubmit();
  });
};

const wireItemActions = () => {
  document.querySelectorAll(".item").forEach((node) => {
    const id = Number(node.dataset.id);
    const editButton = node.querySelector("[data-action='edit']");
    const deleteButton = node.querySelector("[data-action='delete']");
    const saveButton = node.querySelector("[data-action='save']");

    if (editButton) {
      editButton.addEventListener("click", () => {
        state.editingId = state.editingId === id ? null : id;
        render();
      });
    }

    if (deleteButton) {
      deleteButton.addEventListener("click", async () => {
        await deleteItem(id);
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", async () => {
        const textarea = node.querySelector("[data-role='description']");
        const description = textarea ? textarea.value.trim() : "";
        await updateItem(id, { description });
        state.editingId = null;
        render();
      });
    }
  });
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error("Request failed");
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

const loadItems = async () => {
  try {
    state.items = await fetchJson(`${apiBase}/items`);
  } catch (_error) {
    state.items = [];
  }
};

const createItem = async (payload) => {
  try {
    const newItem = await fetchJson(`${apiBase}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    state.items = [newItem, ...state.items];
    render();
  } catch (_error) {
    alert("Failed to add item");
  }
};

const updateItem = async (id, payload) => {
  try {
    const updated = await fetchJson(`${apiBase}/items/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    state.items = state.items.map((item) => (item.id === id ? updated : item));
  } catch (_error) {
    alert("Failed to update item");
  }
};

const deleteItem = async (id) => {
  try {
    await fetchJson(`${apiBase}/items/${id}`, { method: "DELETE" });
    state.items = state.items.filter((item) => item.id !== id);
    if (state.editingId === id) {
      state.editingId = null;
    }
    render();
  } catch (_error) {
    alert("Failed to remove item");
  }
};

const start = async () => {
  await loadItems();
  render();
};

start();
