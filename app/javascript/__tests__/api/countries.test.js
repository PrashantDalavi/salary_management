import {
  createCountry,
  deleteCountry,
  getCountries,
  getCountry,
  updateCountry,
} from "../../api/countries";

function mockResponse({ ok = true, status = 200, body = {} } = {}) {
  global.fetch.mockResolvedValueOnce({
    ok,
    status,
    text: jest.fn().mockResolvedValue(body === null ? "" : JSON.stringify(body)),
  });
}

describe("countries api", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches countries index with pagination params", async () => {
    const payload = {
      countries: [{ id: 1, name: "India", code: "IN" }],
      pagination: { current_page: 2, per_page: 5, total_count: 12, total_pages: 3 },
    };
    mockResponse({ body: payload });

    const result = await getCountries({ page: 2, perPage: 5 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/countries?page=2&per_page=5",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual(payload);
  });

  it("fetches one country (show)", async () => {
    const payload = { id: 11, name: "Japan", code: "JP" };
    mockResponse({ body: payload });

    const result = await getCountry(11);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/countries/11",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual(payload);
  });

  it("creates country", async () => {
    const payload = { id: 3, name: "Germany", code: "DE" };
    mockResponse({ status: 201, body: payload });

    const result = await createCountry({ name: "Germany", code: "DE" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/countries",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ country: { name: "Germany", code: "DE" } }),
      }),
    );
    expect(result).toEqual(payload);
  });

  it("updates country", async () => {
    const payload = { id: 3, name: "Deutschland", code: "DE" };
    mockResponse({ body: payload });

    const result = await updateCountry(3, { name: "Deutschland", code: "DE" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/countries/3",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ country: { name: "Deutschland", code: "DE" } }),
      }),
    );
    expect(result).toEqual(payload);
  });

  it("deletes country", async () => {
    mockResponse({ status: 204, body: null });

    const result = await deleteCountry(9);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/countries/9",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result).toBe(true);
  });

  it("returns parsed validation errors", async () => {
    mockResponse({
      ok: false,
      status: 422,
      body: { errors: ["Name can't be blank"] },
    });

    await expect(createCountry({ name: "", code: "IN" })).rejects.toMatchObject({
      status: 422,
      data: { errors: ["Name can't be blank"] },
    });
  });
});
