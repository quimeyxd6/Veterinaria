const STORAGE_KEYS = {
  USERS: "vet_users",
  PATIENTS: "vet_patients",
  LOGGED_IN: "vet_logged_in_user",
};

const OPERATIONS_OPTIONS = [
  "Castración",
  "Piometra",
  "Cesárea",
  "Extirpación de tumor"
];

const STUDIES_OPTIONS = [
  "Análisis de sangre",
  "Cardiólogo",
  "Ecografía"
];

// ---------- Utilidades de localStorage ----------
function loadFromStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error leyendo localStorage", key, e);
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Inicializar usuario de prueba ----------
function ensureDefaultUser() {
  const users = loadFromStorage(STORAGE_KEYS.USERS, []);
  const exists = users.some(u => u.email === "admin@vet.local");
  if (!exists) {
    users.push({
      email: "admin@vet.local",
      password: "admin123",
      name: "Admin Veterinaria",
    });
    saveToStorage(STORAGE_KEYS.USERS, users);
  }
}

// ---------- Manejo de vistas ----------
const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const userPill = document.getElementById("user-pill");

function showLogin() {
  loginView.classList.remove("hidden");
  mainView.classList.add("hidden");
}

function showMain(user) {
  loginView.classList.add("hidden");
  mainView.classList.remove("hidden");
  userPill.textContent = `Conectado como: ${user.email}`;
  renderPatients();
}

// usuario logueado en storage
function getLoggedInUser() {
  return loadFromStorage(STORAGE_KEYS.LOGGED_IN, null);
}

function setLoggedInUser(user) {
  if (user) {
    saveToStorage(STORAGE_KEYS.LOGGED_IN, user);
  } else {
    localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
  }
}

// ---------- Login ----------
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const users = loadFromStorage(STORAGE_KEYS.USERS, []);
  const found = users.find(u => u.email === email && u.password === password);

  if (!found) {
    loginError.textContent = "Email o contraseña incorrectos.";
    return;
  }

  loginError.textContent = "";
  setLoggedInUser({ email: found.email, name: found.name });
  showMain(found);
});

// ---------- Logout ----------
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  setLoggedInUser(null);
  showLogin();
});

// ---------- PESTAÑAS ----------
const tabButtons = document.querySelectorAll(".tab-button");
const newPatientSection = document.getElementById("new-patient-section");
const patientsListSection = document.getElementById("patients-list-section");

function showSection(sectionId) {
  // ocultar ambas
  newPatientSection.classList.add("hidden");
  patientsListSection.classList.add("hidden");

  // mostrar la que corresponda
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove("hidden");
  }

  // actualizar estado visual de botones
  tabButtons.forEach(btn => {
    if (btn.dataset.target === sectionId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    showSection(target);
  });
});

// ---------- Pacientes ----------
const patientForm = document.getElementById("patient-form");
const patientsBody = document.getElementById("patients-body");
const patientInfo = document.getElementById("patient-info");

function getPatients() {
  return loadFromStorage(STORAGE_KEYS.PATIENTS, []);
}

function setPatients(patients) {
  saveToStorage(STORAGE_KEYS.PATIENTS, patients);
}

function renderPatients() {
  const patients = getPatients().sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  patientsBody.innerHTML = "";

  if (patients.length === 0) {
    patientInfo.textContent = "Todavía no hay pacientes cargados.";
    return;
  } else {
    patientInfo.textContent = `Total de pacientes: ${patients.length}`;
  }

  patients.forEach(p => {
    const tr = document.createElement("tr");

    // Paciente
    const tdName = document.createElement("td");
    tdName.textContent = p.patientName || "-";

    // Responsable
    const tdOwner = document.createElement("td");
    tdOwner.textContent = p.ownerName || "-";

    // Teléfono
    const tdPhone = document.createElement("td");
    tdPhone.textContent = p.ownerPhone || "-";

    // Fecha (formato corto 24h)
    const tdDate = document.createElement("td");
    const date = new Date(p.createdAt);
    tdDate.textContent = date.toLocaleString("es-AR", {
      hour12: false,
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Acciones
    const tdActions = document.createElement("td");

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn-outline btn-sm";
    viewBtn.textContent = "Ver / editar";
    viewBtn.addEventListener("click", () => {
      window.location.href = `patient.html?id=${encodeURIComponent(p.id)}`;
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-danger btn-sm";
    deleteBtn.textContent = "Eliminar";
    deleteBtn.style.marginLeft = "4px";
    deleteBtn.addEventListener("click", () => {
      const ok = confirm(`¿Eliminar la ficha de "${p.patientName}"?`);
      if (!ok) return;

      const updated = getPatients().filter(item => item.id !== p.id);
      setPatients(updated);
      renderPatients();
    });

    tdActions.appendChild(viewBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdName);
    tr.appendChild(tdOwner);
    tr.appendChild(tdPhone);
    tr.appendChild(tdDate);
    tr.appendChild(tdActions);

    patientsBody.appendChild(tr);
  });
}

function validatePatientData({ patientName, species, age, ownerName, ownerPhone }) {
  const errors = {};

  // Nombre del paciente
  if (!patientName || patientName.trim().length < 2) {
    errors.patientName = "El nombre del paciente debe tener al menos 2 caracteres.";
  }

  // Especie
  if (!species || species.trim().length < 3) {
    errors.species = "La especie es obligatoria (mínimo 3 caracteres).";
  }

  // Edad (si se ingresó)
  if (age !== undefined && age !== null && String(age).trim() !== "") {
    const n = Number(age);
    if (Number.isNaN(n)) {
      errors.age = "La edad debe ser un número.";
    } else if (n < 0) {
      errors.age = "La edad no puede ser negativa.";
    } else if (n > 40) {
      errors.age = "Revisá la edad: parece demasiado alta.";
    }
  }

  // Responsable
  if (!ownerName || ownerName.trim().length < 3) {
    errors.ownerName = "El nombre del responsable debe tener al menos 3 caracteres.";
  }

  // Teléfono (si se ingresó)
  if (ownerPhone && ownerPhone.trim() !== "") {
    const phonePattern = /^[0-9+\-\s()]{6,20}$/;
    if (!phonePattern.test(ownerPhone.trim())) {
      errors.ownerPhone = "El teléfono contiene caracteres inválidos o es demasiado corto.";
    }
  }

  return errors;
}

patientForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // leer valores del formulario
  const patientName = document.getElementById("patient-name").value.trim();
  const species = document.getElementById("patient-species").value.trim();
  const breed = document.getElementById("patient-breed").value.trim();
  const age = document.getElementById("patient-age").value.trim();
  const ownerName = document.getElementById("owner-name").value.trim();
  const ownerPhone = document.getElementById("owner-phone").value.trim();
  const notes = document.getElementById("patient-notes").value.trim();

  const vaccinesRadio = document.querySelector('input[name="vaccines"]:checked');
  const vaccinesUpToDate = vaccinesRadio ? vaccinesRadio.value : "";

  // VALIDACIÓN
  const errors = validatePatientData({
    patientName,
    species,
    age,
    ownerName,
    ownerPhone,
  });

  if (Object.keys(errors).length > 0) {
    // mostrar todos los errores juntos
    alert(Object.values(errors).join("\n"));
    return; // ⛔ NO GUARDAR
  }

  // SI LLEGA ACÁ, ESTÁ TODO OK → GUARDAMOS
  const patients = getPatients();
  const newPatient = {
    id: Date.now().toString(),
    patientName,
    species,
    breed,
    age,
    vaccinesUpToDate,
    // por ahora sin operations/recentStudies
    ownerName,
    ownerPhone,
    notes,
    createdAt: new Date().toISOString(),
  };

  patients.push(newPatient);
  setPatients(patients);
  renderPatients();

  patientForm.reset();
  showSection("patients-list-section");
});
