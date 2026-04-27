import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../services/api";

describe("Department API service", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  it("fetches departments index with pagination", async () => {
    const payload = {
      departments: [{ id: 1, name: "Engineering", code: "ENG" }],
      pagination: { current_page: 1, per_page: 10, total_count: 1, total_pages: 1 },
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchDepartments();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/departments?page=1&per_page=10",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(result).toEqual(payload);
  });

  it("fetches departments with custom pagination", async () => {
    const payload = {
      departments: [{ id: 1, name: "Engineering", code: "ENG" }],
      pagination: { current_page: 2, per_page: 5, total_count: 6, total_pages: 2 },
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchDepartments({ page: 2, perPage: 5 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/departments?page=2&per_page=5",
      expect.anything(),
    );
    expect(result).toEqual(payload);
  });

  it("creates a department with JSON body", async () => {
    const payload = { id: 2, name: "HR", code: "HR", country_id: 1 };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await createDepartment({ name: "HR", code: "HR", country_id: 1 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/departments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ department: { name: "HR", code: "HR", country_id: 1 } }),
      }),
    );
    expect(result).toEqual(payload);
  });

  it("updates a department with JSON body", async () => {
    const payload = { id: 1, name: "New Eng", code: "ENG", country_id: 1 };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await updateDepartment(1, { name: "New Eng" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/departments/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ department: { name: "New Eng" } }),
      }),
    );
    expect(result).toEqual(payload);
  });

  it("deletes a department", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Deleted" }),
    });

    const result = await deleteDepartment(1);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/departments/1",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
    expect(result).toEqual({ message: "Deleted" });
  });

  it("throws error when response is not ok", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ errors: ["Name can't be blank"] }),
    });

    await expect(createDepartment({ name: "" })).rejects.toThrow("Name can't be blank");
  });
});
