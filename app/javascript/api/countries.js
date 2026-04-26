const BASE_PATH = "/api/v1/countries";

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

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
    headers: { Accept: "application/json" },
  });

  return parseResponse(response);
}

export async function getCountry(id) {
  const response = await fetch(`${BASE_PATH}/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return parseResponse(response);
}

export async function createCountry(payload) {
  const response = await fetch(BASE_PATH, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ country: payload }),
  });

  return parseResponse(response);
}

export async function updateCountry(id, payload) {
  const response = await fetch(`${BASE_PATH}/${id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ country: payload }),
  });

  return parseResponse(response);
}

export async function deleteCountry(id) {
  const response = await fetch(`${BASE_PATH}/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  await parseResponse(response);
  return true;
}
