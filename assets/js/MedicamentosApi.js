const API_MEDICAMENTOS = "https://localhost:7273/api/Medicamentos";

document.addEventListener("DOMContentLoaded", () => {
  cargarMedicamentos();

  document.getElementById("addMedBtn").addEventListener("click", () => {
    document.getElementById("medicineModal").classList.remove("hidden");
    document.getElementById("medicineForm").reset();
  });

  document.getElementById("medicineForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    data.cantidad = parseInt(data.cantidad);
    data.stockMinimo = parseInt(data.stockMinimo);
    data.proveedorId = parseInt(data.proveedorId);

    let url = API_MEDICAMENTOS;
    let method = "POST";

    if (form.dataset.id) {
      url += `/${form.dataset.id}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert("Guardado correctamente.");
      form.reset();
      form.removeAttribute("data-id");
      document.getElementById("medicineModal").classList.add("hidden");
      cargarMedicamentos();
    } else {
      alert("Error al guardar.");
    }
  });

  document.getElementById("searchInput").addEventListener("input", cargarMedicamentos);
  document.getElementById("filterType").addEventListener("change", cargarMedicamentos);
  document.getElementById("filterStatus").addEventListener("change", cargarMedicamentos);
});

async function cargarMedicamentos() {
  const res = await fetch(API_MEDICAMENTOS);
  const data = await res.json();
  const tabla = document.getElementById("medicineTableBody");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const tipo = document.getElementById("filterType").value;
  const estado = document.getElementById("filterStatus").value;

  tabla.innerHTML = "";

  data
    .filter(med => {
      const matchSearch = med.nombre.toLowerCase().includes(search) || med.codigo.toLowerCase().includes(search);
      const matchTipo = !tipo || med.tipoAnimal === tipo;
      const estatus = getEstado(med);
      const matchEstado = !estado || estado === estatus;
      return matchSearch && matchTipo && matchEstado;
    })
    .forEach(med => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${med.codigo}</td>
        <td>${med.nombre}<br><small class="text-light">Dosis: ${med.dosis}</small></td>
        <td>${med.cantidad} / ${med.stockMinimo}</td>
        <td>${med.tipoAnimal}</td>
        <td>${med.fechaVencimiento.split("T")[0]}</td>
        <td>${getBadge(getEstado(med))}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editarMedicamento(${med.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarMedicamento(${med.id})">🗑️</button>
        </td>`;
      tabla.appendChild(fila);
    });
}

function getEstado(med) {
  const vencimiento = new Date(med.fechaVencimiento);
  const hoy = new Date();
  if (vencimiento < hoy) return "expired";
  if (med.cantidad <= med.stockMinimo) return "low";
  if (med.cantidad === 0) return "outofstock";
  return "available";
}

function getBadge(status) {
  const map = {
    available: '<span class="status-badge status-available">Disponible</span>',
    low: '<span class="status-badge status-low">Stock Bajo</span>',
    expired: '<span class="status-badge status-expired">Vencido</span>',
    outofstock: '<span class="status-badge status-expired">Sin Stock</span>',
  };
  return map[status] || "";
}

async function editarMedicamento(id) {
  const res = await fetch(`${API_MEDICAMENTOS}/${id}`);
  const med = await res.json();
  const form = document.getElementById("medicineForm");

  Object.keys(med).forEach(k => {
    if (form[k]) form[k].value = med[k];
  });

  document.getElementById("medicineModal").classList.remove("hidden");
  form.dataset.id = id;
}

async function eliminarMedicamento(id) {
  if (confirm("¿Seguro que deseas eliminar este medicamento?")) {
    const res = await fetch(`${API_MEDICAMENTOS}/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Eliminado correctamente.");
      cargarMedicamentos();
    } else {
      alert("Error al eliminar.");
    }
  }
}
