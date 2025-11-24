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
  // ordenar por fecha descendente (último primero)
  const patients = getPatients().sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  patientsBody.innerHTML = "";

  if (patients.length === 0) {
    patientInfo.textContent = "Todavía no hay pacientes cargados.";
  } else {
    patientInfo.textContent = `Total de pacientes: ${patients.length}`;
  }

  patients.forEach(p => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = p.patientName;

    const tdSpecies = document.createElement("td");
    tdSpecies.textContent = `${p.species || "-"} / ${p.breed || "-"}`;

    const tdAge = document.createElement("td");
    tdAge.textContent = p.age ? `${p.age} años` : "-";

    const tdVaccines = document.createElement("td");
    tdVaccines.textContent = p.vaccinesUpToDate || "-";

    const tdOperations = document.createElement("td");
    tdOperations.textContent =
      p.operations && p.operations.length > 0
        ? p.operations.join(", ")
        : "-";

    const tdStudies = document.createElement("td");
    tdStudies.textContent =
      p.recentStudies && p.recentStudies.length > 0
        ? p.recentStudies.join(", ")
        : "-";

    const tdOwner = document.createElement("td");
    tdOwner.innerHTML = `<strong>${p.ownerName || "-"}</strong><br>${p.ownerPhone || ""}`;

    const tdNotes = document.createElement("td");
    tdNotes.textContent = p.notes || "-";

    const tdDate = document.createElement("td");
    const date = new Date(p.createdAt);
    tdDate.textContent = date.toLocaleString();

    tr.appendChild(tdName);
    tr.appendChild(tdSpecies);
    tr.appendChild(tdAge);
    tr.appendChild(tdVaccines);
    tr.appendChild(tdOperations);
    tr.appendChild(tdStudies);
    tr.appendChild(tdOwner);
    tr.appendChild(tdNotes);
    tr.appendChild(tdDate);

    patientsBody.appendChild(tr);
  });
}

patientForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const patientName = document.getElementById("patient-name").value.trim();
  const species = document.getElementById("patient-species").value.trim();
  const breed = document.getElementById("patient-breed").value.trim();
  const age = document.getElementById("patient-age").value.trim();

  const vaccinesRadio = document.querySelector('input[name="vaccines"]:checked');
  const vaccinesUpToDate = vaccinesRadio ? vaccinesRadio.value : "";

  /*const operationsSelect = document.getElementById("patient-operations");
  const operations = Array.from(operationsSelect.selectedOptions).map(opt => opt.value);

  const studiesSelect = document.getElementById("patient-studies");
  const recentStudies = Array.from(studiesSelect.selectedOptions).map(opt => opt.value);*/

  const ownerName = document.getElementById("owner-name").value.trim();
  const ownerPhone = document.getElementById("owner-phone").value.trim();
  const notes = document.getElementById("patient-notes").value.trim();

  if (!patientName || !species || !ownerName) {
    alert("Completá al menos: nombre del paciente, especie y responsable.");
    return;
  }

  const patients = getPatients();
  const newPatient = {
    id: Date.now().toString(),
    patientName,
    species,
    breed,
    age,
    vaccinesUpToDate,
    /*operations,
    recentStudies,*/
    ownerName,
    ownerPhone,
    notes,
    createdAt: new Date().toISOString(),
  };

  patients.push(newPatient);
  setPatients(patients);
  renderPatients();

  patientForm.reset();

  // al guardar, vamos a la pestaña de pacientes guardados
  showSection("patients-list-section");
});

// ---------- Inicialización ----------
ensureDefaultUser();
const existingUser = getLoggedInUser();
// cargar opciones dinámicamente
/*
loadOptionsIntoSelect("patient-operations", OPERATIONS_OPTIONS);
loadOptionsIntoSelect("patient-studies", STUDIES_OPTIONS);

// hacer expandibles
setupExpandableMultiSelect("patient-operations");
setupExpandableMultiSelect("patient-studies");

if (existingUser) {
  showMain(existingUser);
  showSection("new-patient-section");
} else {
  showLogin();
}



function loadOptionsIntoSelect(selectId, optionsArray) {
  const select = document.getElementById(selectId);

  // limpiar por si recargamos opciones
  select.innerHTML = "";

  // opción fantasma (placeholder oculto)
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.hidden = true;
  select.appendChild(placeholder);

  // agregar opciones reales
  optionsArray.forEach(op => {
    const option = document.createElement("option");
    option.value = op;
    option.textContent = op;
    select.appendChild(option);
  });
}

function setupExpandableMultiSelect(selectId) {
  const select = document.getElementById(selectId);

  select.addEventListener("focus", () => {
    // abrir con todas las opciones visibles
    select.size = select.options.length;
  });

  select.addEventListener("blur", () => {
    // cerrarlo cuando pierde foco
    setTimeout(() => {
      select.size = 1;
    }, 150);
  });
}
*/ //Cancelo el codigo momentaneamente para seguir con otras funcionalidades hasta saber como agregar las opciones dinamicamente sin que se rompa lpm