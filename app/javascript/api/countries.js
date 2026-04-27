const BASE_PATH = "/api/v1/countries";

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
}

function defaultHeaders(includeJsonContentType = false) {
  const headers = {
    Accept: "application/json",
  };

  const token = csrfToken();
  if (token) headers["X-CSRF-Token"] = token;
  if (includeJsonContentType) headers["Content-Type"] = "application/json";

  return headers;
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (response.ok) {
    return data;
  }

  const message =
    data?.error ||
    (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
    "Request failed";

  const error = new Error(message);
  error.status = response.status;
  error.data = data;
  throw error;
}

export async function getCountries({ page = 1, perPage = 10 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  const response = await fetch(`${BASE_PATH}?${params.toString()}`, {
    method: "GET",
    headers: defaultHeaders(),
  });

  return parseResponse(response);
}

export async function getCountry(id) {
  const response = await fetch(`${BASE_PATH}/${id}`, {
    method: "GET",
    headers: defaultHeaders(),
  });

  return parseResponse(response);
}

export async function createCountry(payload) {
  const body = new URLSearchParams({
    "country[name]": payload.name,
    "country[code]": payload.code,
  });

  const response = await fetch(BASE_PATH, {
    method: "POST",
    headers: defaultHeaders(),
    body,
  });

  return parseResponse(response);
}

export async function updateCountry(id, payload) {
  const body = new URLSearchParams({
    "country[name]": payload.name,
    "country[code]": payload.code,
  });

  const response = await fetch(`${BASE_PATH}/${id}`, {
    method: "PUT",
    headers: defaultHeaders(),
    body,
  });

  return parseResponse(response);
}

export async function deleteCountry(id) {
  const response = await fetch(`${BASE_PATH}/${id}`, {
    method: "DELETE",
    headers: defaultHeaders(),
  });

  await parseResponse(response);
  return true;
}
