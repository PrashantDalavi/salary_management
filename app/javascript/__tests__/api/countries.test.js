import {
  fetchCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from "../../services/api";

describe("countries api", () => {
  beforeEach(() => {
    global.fetch.mockReset();
  });

  it("fetches countries index", async () => {
    const payload = {
      countries: [{ id: 1, name: "India", code: "IN" }],
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchCountries();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/countries",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(result).toEqual(payload.countries);
  });

  it("creates a country with JSON body", async () => {
    const payload = { id: 3, name: "Germany", code: "DE" };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });

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

  it("updates a country with PATCH", async () => {
    const payload = { id: 3, name: "Deutschland", code: "DE" };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await updateCountry(3, { name: "Deutschland", code: "DE" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/countries/3",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ country: { name: "Deutschland", code: "DE" } }),
      }),
    );
    expect(result).toEqual(payload);
  });

  it("deletes a country", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "deleted" }),
    });

    const result = await deleteCountry(9);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/countries/9",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result).toEqual({ message: "deleted" });
  });

  it("throws on validation errors", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ errors: ["Name can't be blank"] }),
    });

    await expect(createCountry({ name: "", code: "IN" })).rejects.toThrow(
      "Name can't be blank",
    );
  });
});
