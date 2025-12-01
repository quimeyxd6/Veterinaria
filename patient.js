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

// utilidades storage
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

function getPatients() {
  return loadFromStorage(STORAGE_KEYS.PATIENTS, []);
}

function setPatients(patients) {
  saveToStorage(STORAGE_KEYS.PATIENTS, patients);
}

// helper: leer query string
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function returnToListAndClose() {
  if (window.opener && !window.opener.closed) {
    try {
      // Recargar la pestaña original, y forzar vista listado fichas
      window.opener.location.href = "index.html?view=list";
    } catch (e) {
      console.error("No se pudo actualizar la pestaña de origen", e);
    }
    window.close();
  } else {
    window.location.href = "index.html?view=list";
  }
}

// chips
function renderChipsWithSelection(containerId, optionsArray, selectedValues) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  const selectedSet = new Set(selectedValues || []);

  optionsArray.forEach(op => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = op;
    chip.dataset.value = op;

    if (selectedSet.has(op)) {
      chip.classList.add("selected");
    }

    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
    });

    container.appendChild(chip);
  });
}

// DOM refs
const backBtn = document.getElementById("back-btn");
const infoEl = document.getElementById("patient-edit-info");
const form = document.getElementById("edit-patient-form");

const inputName = document.getElementById("edit-patient-name");
const inputSpecies = document.getElementById("edit-patient-species");
const inputBreed = document.getElementById("edit-patient-breed");
const inputAge = document.getElementById("edit-patient-age");
const inputOwnerName = document.getElementById("edit-owner-name");
const inputOwnerPhone = document.getElementById("edit-owner-phone");
const inputNotes = document.getElementById("edit-patient-notes");

// volver al listado
backBtn.addEventListener("click", () => {
  returnToListAndClose();
});

const patientId = getQueryParam("id");
if (!patientId) {
  infoEl.textContent = "No se encontró el ID del paciente en la URL.";
  form.classList.add("hidden");
} else {
  const patients = getPatients();
  const p = patients.find(p => p.id === patientId);

  if (!p) {
    infoEl.textContent = "No se encontró la ficha del paciente.";
    form.classList.add("hidden");
  } else {
    infoEl.textContent = `Editando ficha de: ${p.patientName}`;

    // completar campos
    inputName.value = p.patientName || "";
    inputSpecies.value = p.species || "";
    inputBreed.value = p.breed || "";
    inputAge.value = p.age || "";
    inputOwnerName.value = p.ownerName || "";
    inputOwnerPhone.value = p.ownerPhone || "";
    inputNotes.value = p.notes || "";

    // vacunas
    if (p.vaccinesUpToDate === "Si" || p.vaccinesUpToDate === "No") {
      const radio = document.querySelector(`input[name="edit-vaccines"][value="${p.vaccinesUpToDate}"]`);
      if (radio) radio.checked = true;
    }

    // chips operaciones / estudios
    renderChipsWithSelection("edit-operations-chips", OPERATIONS_OPTIONS, p.operations);
    renderChipsWithSelection("edit-studies-chips", STUDIES_OPTIONS, p.recentStudies);
  }
}

// guardar cambios
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const vaccinesRadio = document.querySelector('input[name="edit-vaccines"]:checked');
  const vaccinesUpToDate = vaccinesRadio ? vaccinesRadio.value : "";

  const operations = Array.from(
    document.querySelectorAll("#edit-operations-chips .chip.selected")
  ).map(chip => chip.dataset.value);

  const recentStudies = Array.from(
    document.querySelectorAll("#edit-studies-chips .chip.selected")
  ).map(chip => chip.dataset.value);

  if (!inputName.value.trim() || !inputSpecies.value.trim() || !inputOwnerName.value.trim()) {
    alert("Completá al menos: nombre del paciente, especie y responsable.");
    return;
  }

  const patients = getPatients();
  const idx = patients.findIndex(p => p.id === patientId);
  if (idx === -1) {
    alert("No se pudo guardar: ficha no encontrada.");
    return;
  }

  // actualizar objeto
  patients[idx] = {
    ...patients[idx],
    patientName: inputName.value.trim(),
    species: inputSpecies.value.trim(),
    breed: inputBreed.value.trim(),
    age: inputAge.value.trim(),
    vaccinesUpToDate,
    operations,
    recentStudies,
    ownerName: inputOwnerName.value.trim(),
    ownerPhone: inputOwnerPhone.value.trim(),
    notes: inputNotes.value.trim(),
    // mantenemos createdAt original
  };

  setPatients(patients);
  alert("Cambios guardados correctamente.");
  returnToListAndClose();
});
