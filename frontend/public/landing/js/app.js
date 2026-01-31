// =======================
// Helpers (ES6+)
// =======================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const STORAGE_KEY = "autrust_autos";
const AUTH_KEY = "autrust_user";

const DEFAULT_AUTOS = [
  {
    id: crypto.randomUUID(),
    marca: "BMW",
    modelo: "Serie 3 330i",
    anio: 2022,
    precio: 660000,
    estado: "disponible",
    descripcion: "Servicios al día, factura original, llantas nuevas.",
  },
  {
    id: crypto.randomUUID(),
    marca: "Audi",
    modelo: "A4 S-Line",
    anio: 2021,
    precio: 800000,
    estado: "apartado",
    descripcion: "Único dueño, interiores impecables, seguro vigente.",
  },
  {
    id: crypto.randomUUID(),
    marca: "Mercedes",
    modelo: "C200",
    anio: 2020,
    precio: 1100000,
    estado: "vendido",
    descripcion: "Excelente manejo, historial limpio, garantía extendida.",
  },
];

function readAutos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AUTOS));
    return [...DEFAULT_AUTOS];
  }
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [...DEFAULT_AUTOS];
  } catch {
    return [...DEFAULT_AUTOS];
  }
}

function saveAutos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function toast(msg) {
  const el = $("#toast");
  el.hidden = false;
  el.textContent = msg;
  setTimeout(() => (el.hidden = true), 1600);
}

function alertMsg(msg) {
  const el = $("#alert");
  el.hidden = false;
  el.textContent = `❌ ${msg}`;
}

function clearAlert() {
  $("#alert").hidden = true;
  $("#alert").textContent = "";
}

function money(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-MX")}`;
}

// =======================
// UI State
// =======================
let autos = readAutos();
let editingId = null;

// auth demo
let user = null;

function loadUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setUser(u) {
  user = u;
  if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  else localStorage.removeItem(AUTH_KEY);
  syncAuthUI();
}

function syncAuthUI() {
  const chip = $("#loginChip");
  const menuLogin = $("#menuLogin");

  if (user?.email) {
    chip.textContent = "Cerrar sesión";
    menuLogin.textContent = "Cerrar sesión";
  } else {
    chip.textContent = "Iniciar sesión";
    menuLogin.textContent = "Iniciar sesión";
  }
}

// =======================
// Layout actions
// =======================
function toggleMenu() {
  $("#sidebar").classList.toggle("active");
}
function toggleSearch() {
  $("#searchBar").classList.toggle("active");
  if ($("#searchBar").classList.contains("active")) {
    $("#searchInputTop").focus();
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  $("#sidebar").classList.remove("active");
}

// =======================
// Render cards
// =======================
function getFilters() {
  const q = ($("#q").value || "").trim().toLowerCase();
  const estado = $("#estadoFiltro").value || "";
  return { q, estado };
}

function applyFilters(list) {
  const { q, estado } = getFilters();

  return list.filter((a) => {
    const text =
      `${a.marca || ""} ${a.modelo || ""} ${a.estado || ""} ${a.descripcion || ""}`.toLowerCase();

    const matchText = !q || text.includes(q);
    const matchEstado = !estado || a.estado === estado;

    return matchText && matchEstado;
  });
}

function cardTemplate(a) {
  return `
    <article class="card" data-id="${a.id}">
      <div class="card-head">
        <div>
          <div class="card-title">${a.marca || "—"} <span class="muted">${a.modelo || ""}</span></div>
          <div class="card-meta">
            <span>${a.anio ?? "—"}</span>
            <span class="dot"></span>
            <span>${money(a.precio)}</span>
          </div>
        </div>
        <span class="badge badge-${a.estado}">${a.estado}</span>
      </div>

      <p class="card-desc">${a.descripcion ? a.descripcion : "<span class='muted'>Sin descripción.</span>"}</p>

      <div class="card-footer">
        <button class="btn btn-ghost" data-action="edit">Editar</button>
        <button class="btn btn-danger" data-action="delete">Eliminar</button>
      </div>
    </article>
  `;
}

function render() {
  clearAlert();

  const grid = $("#cardsGrid");
  const empty = $("#emptyState");

  const list = applyFilters(autos);

  if (list.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  grid.innerHTML = list.map(cardTemplate).join("");
}

// =======================
// Modal CRUD
// =======================
function openCrud(mode, auto = null) {
  const modal = $("#crudModal");
  const title = $("#crudTitle");
  const form = $("#crudForm");

  if (mode === "edit" && auto) {
    editingId = auto.id;
    title.textContent = "Editar auto";
    form.marca.value = auto.marca ?? "";
    form.modelo.value = auto.modelo ?? "";
    form.anio.value = auto.anio ?? "";
    form.precio.value = auto.precio ?? "";
    form.estado.value = auto.estado ?? "disponible";
    form.descripcion.value = auto.descripcion ?? "";
  } else {
    editingId = null;
    title.textContent = "Publicar auto";
    form.reset();
    form.estado.value = "disponible";
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  form.marca.focus();
}

function closeCrud() {
  const modal = $("#crudModal");
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function validateForm(data) {
  if (!data.marca.trim()) return "Marca es obligatoria";
  if (!data.modelo.trim()) return "Modelo es obligatorio";

  if (data.anio !== "") {
    const y = Number(data.anio);
    if (!Number.isFinite(y) || y < 1900 || y > 2100) return "Año inválido";
  }
  if (data.precio !== "") {
    const p = Number(data.precio);
    if (!Number.isFinite(p) || p < 0) return "Precio inválido";
  }
  const estados = new Set(["disponible", "apartado", "vendido"]);
  if (!estados.has(data.estado)) return "Estado inválido";

  return "";
}

function upsertAuto(payload) {
  if (editingId) {
    autos = autos.map((a) => (a.id === editingId ? { ...a, ...payload } : a));
    toast("✅ Auto actualizado");
  } else {
    autos = [{ id: crypto.randomUUID(), ...payload }, ...autos];
    toast("✅ Auto publicado");
  }
  saveAutos(autos);
  render();
  closeCrud();
}

function deleteAuto(id) {
  const a = autos.find((x) => x.id === id);
  const ok = confirm(`¿Eliminar ${a?.marca || ""} ${a?.modelo || ""}?`);
  if (!ok) return;

  autos = autos.filter((x) => x.id !== id);
  saveAutos(autos);
  toast("🗑️ Auto eliminado");
  render();
}

// =======================
// Login demo (sin token)
// =======================
function openLogin() {
  const modal = $("#loginModal");
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  $("#email").focus();
}

function closeLogin() {
  const modal = $("#loginModal");
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  $("#errorMessage").hidden = true;
}

function loginDemo() {
  const email = $("#email").value.trim();
  const pass = $("#password").value;

  const error = $("#errorMessage");
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

  if (!email) {
    error.textContent = "Ingresa un correo.";
    error.hidden = false;
    return;
  }
  if (!passwordRegex.test(pass)) {
    error.textContent =
      "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y un número.";
    error.hidden = false;
    return;
  }

  error.hidden = true;
  setUser({ email });
  closeLogin();
  toast(`👤 Sesión iniciada: ${email}`);
}

function logoutDemo() {
  setUser(null);
  toast("👋 Sesión cerrada");
}

// =======================
// Events
// =======================
function bindEvents() {
  // header
  $("#menuBtn").addEventListener("click", toggleMenu);
  $("#searchIcon").addEventListener("click", toggleSearch);

  // login chip
  $("#loginChip").addEventListener("click", () => {
    if (user?.email) logoutDemo();
    else openLogin();
  });

  // sidebar menu actions
  $("#menuItems").addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    if (li.id === "menuLogin") {
      if (user?.email) logoutDemo();
      else openLogin();
      $("#sidebar").classList.remove("active");
      return;
    }

    const id = li.getAttribute("data-scroll");
    if (id) scrollToSection(id);
  });

  // top hero buttons
  $("#goBuy").addEventListener("click", () => scrollToSection("models"));
  $("#goSell").addEventListener("click", () => scrollToSection("sell"));

  // sell actions
  $("#sellNow").addEventListener("click", () => openCrud("create"));
  $("#howWorks").addEventListener("click", () => alert("Demo: aquí pondrás tu sección de pasos."));

  // filters
  $("#q").addEventListener("input", render);
  $("#estadoFiltro").addEventListener("change", render);

  // open create
  $("#btnOpenCreate").addEventListener("click", () => openCrud("create"));
  $("#btnEmptyCreate").addEventListener("click", () => openCrud("create"));

  // card actions (delegation)
  $("#cardsGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const card = e.target.closest(".card");
    if (!card) return;

    const id = card.getAttribute("data-id");
    const action = btn.getAttribute("data-action");

    if (action === "edit") {
      const auto = autos.find((x) => x.id === id);
      if (auto) openCrud("edit", auto);
    }
    if (action === "delete") deleteAuto(id);
  });

  // CRUD modal close
  $("#closeCrud").addEventListener("click", closeCrud);
  $("#cancelCrud").addEventListener("click", closeCrud);
  $("#crudModal").addEventListener("click", (e) => {
    if (e.target === $("#crudModal")) closeCrud();
  });

  // CRUD submit
  $("#crudForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearAlert();

    const form = e.currentTarget;
    const payload = {
      marca: form.marca.value.trim(),
      modelo: form.modelo.value.trim(),
      anio: form.anio.value.trim() === "" ? null : Number(form.anio.value),
      precio: form.precio.value.trim() === "" ? null : Number(form.precio.value),
      estado: form.estado.value,
      descripcion: form.descripcion.value.trim() || null,
    };

    const msg = validateForm({
      marca: form.marca.value,
      modelo: form.modelo.value,
      anio: form.anio.value,
      precio: form.precio.value,
      estado: form.estado.value,
      descripcion: form.descripcion.value,
    });

    if (msg) {
      alertMsg(msg);
      return;
    }

    upsertAuto(payload);
  });

  // login modal
  $("#btnLogin").addEventListener("click", loginDemo);
  $("#closeLogin").addEventListener("click", closeLogin);
  $("#loginModal").addEventListener("click", (e) => {
    if (e.target === $("#loginModal")) closeLogin();
  });

  // top search also filters inventory
  $("#searchInputTop").addEventListener("input", (e) => {
    $("#q").value = e.target.value;
    render();
  });
}

// =======================
// Init
// =======================
function init() {
  user = loadUser();
  syncAuthUI();
  bindEvents();
  render();
}

init();
