// API service layer — real API endpoints

const API_BASE = "/api/v1";

// Helper for API calls
async function request(path, options = {}) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errors?.join(", ") || error.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

// --- COUNTRIES ---

export async function fetchCountries() {
  const data = await request("/countries");
  return data.countries;
}

export async function createCountry(countryData) {
  return request("/countries", {
    method: "POST",
    body: JSON.stringify({ country: countryData }),
  });
}

export async function updateCountry(id, countryData) {
  return request(`/countries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ country: countryData }),
  });
}

export async function deleteCountry(id) {
  return request(`/countries/${id}`, { method: "DELETE" });
}

export async function bulkImportCountries(file) {
  const formData = new FormData();
  formData.append("file", file);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const response = await fetch(`${API_BASE}/countries/bulk_import`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.errors?.join(", ") || "Import failed");
  return data;
}
