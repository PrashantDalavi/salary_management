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

export async function fetchCountries({ page = 1, perPage = 10, search = "" } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (search) params.append("search", search);
  return request(`/countries?${params}`);
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

// --- DEPARTMENTS ---

export async function fetchDepartments({ page = 1, perPage = 10 } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  return request(`/departments?${params}`);
}

export async function createDepartment(departmentData) {
  return request("/departments", {
    method: "POST",
    body: JSON.stringify({ department: departmentData }),
  });
}

export async function updateDepartment(id, departmentData) {
  return request(`/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ department: departmentData }),
  });
}

export async function deleteDepartment(id) {
  return request(`/departments/${id}`, { method: "DELETE" });
}

export async function bulkImportDepartments(file) {
  const formData = new FormData();
  formData.append("file", file);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const response = await fetch(`${API_BASE}/departments/bulk_import`, {
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

// --- EMPLOYEES ---

export async function fetchEmployees({ page = 1, perPage = 10 } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  return request(`/employees?${params}`);
}

export async function createEmployee(employeeData) {
  return request("/employees", {
    method: "POST",
    body: JSON.stringify({ employee: employeeData }),
  });
}

export async function updateEmployee(id, employeeData) {
  return request(`/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ employee: employeeData }),
  });
}

export async function deleteEmployee(id) {
  return request(`/employees/${id}`, { method: "DELETE" });
}

export async function bulkImportEmployees(file) {
  const formData = new FormData();
  formData.append("file", file);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const response = await fetch(`${API_BASE}/employees/bulk_import`, {
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

export async function fetchSalaryInsights({ countryId = "" } = {}) {
  const params = new URLSearchParams();
  if (countryId) params.append("country_id", countryId);
  return request(`/salary_insights?${params}`);
}
