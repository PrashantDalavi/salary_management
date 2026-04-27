import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CountriesList from "../../components/Countries/CountriesList";
import {
  fetchCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  bulkImportCountries,
} from "../../services/api";

jest.mock("../../services/api", () => ({
  fetchCountries: jest.fn(),
  createCountry: jest.fn(),
  updateCountry: jest.fn(),
  deleteCountry: jest.fn(),
  bulkImportCountries: jest.fn(),
}));

const PAGE_1_RESPONSE = {
  countries: [
    { id: 1, name: "India", code: "IN" },
    { id: 2, name: "Japan", code: "JP" },
  ],
  pagination: { current_page: 1, per_page: 10, total_count: 2, total_pages: 1 },
};

const MULTI_PAGE_RESPONSE_P1 = {
  countries: [{ id: 1, name: "India", code: "IN" }],
  pagination: { current_page: 1, per_page: 1, total_count: 3, total_pages: 3 },
};

const MULTI_PAGE_RESPONSE_P2 = {
  countries: [{ id: 2, name: "Japan", code: "JP" }],
  pagination: { current_page: 2, per_page: 1, total_count: 3, total_pages: 3 },
};

describe("CountriesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders country rows with pagination info", async () => {
    fetchCountries.mockResolvedValueOnce(PAGE_1_RESPONSE);

    render(<CountriesList globalSearch="" />);

    expect(await screen.findByText("India")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("2 countries")).toBeInTheDocument();
    expect(screen.getByText(/Showing 1–2 of 2/)).toBeInTheDocument();
  });

  it("calls fetchCountries with page and perPage params", async () => {
    fetchCountries.mockResolvedValueOnce(PAGE_1_RESPONSE);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    expect(fetchCountries).toHaveBeenCalledWith({ page: 1, perPage: 10, search: "" });
  });

  it("navigates to next page when page button is clicked", async () => {
    fetchCountries
      .mockResolvedValueOnce(MULTI_PAGE_RESPONSE_P1)
      .mockResolvedValueOnce(MULTI_PAGE_RESPONSE_P2);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("›"));

    await waitFor(() => {
      expect(fetchCountries).toHaveBeenCalledTimes(2);
      expect(fetchCountries).toHaveBeenLastCalledWith({ page: 2, perPage: 10, search: "" });
    });
  });

  it("disables previous button on first page", async () => {
    fetchCountries.mockResolvedValueOnce(MULTI_PAGE_RESPONSE_P1);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    const prevButtons = screen.getAllByText("‹");
    expect(prevButtons[0]).toBeDisabled();
  });

  it("opens add modal and creates a country", async () => {
    fetchCountries.mockResolvedValue(PAGE_1_RESPONSE);
    createCountry.mockResolvedValue({ id: 3, name: "Germany", code: "DE" });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("+ Add Country"));

    expect(screen.getByText("Add Country")).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    const nameInput = inputs.find(input => input.getAttribute("name") === "name");
    const codeInput = inputs.find(input => input.getAttribute("name") === "code");
    fireEvent.change(nameInput, { target: { name: "name", value: "Germany" } });
    fireEvent.change(codeInput, { target: { name: "code", value: "DE" } });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(createCountry).toHaveBeenCalledWith({ name: "Germany", code: "DE" });
    });
  });

  it("opens edit modal and updates a country", async () => {
    fetchCountries.mockResolvedValue(PAGE_1_RESPONSE);
    updateCountry.mockResolvedValue({ id: 1, name: "Republic of India", code: "IN" });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getAllByText("Edit")[0]);

    expect(screen.getByText("Edit Country")).toBeInTheDocument();
    expect(screen.getByDisplayValue("India")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("India"), { target: { name: "name", value: "Republic of India" } });
    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(updateCountry).toHaveBeenCalledWith(1, { name: "Republic of India", code: "IN" });
    });
  });

  it("opens delete confirmation and deletes a country", async () => {
    fetchCountries.mockResolvedValue(PAGE_1_RESPONSE);
    deleteCountry.mockResolvedValue({});

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getAllByText("Delete")[0]);

    expect(screen.getByText("Delete Country")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Delete").find(btn => btn.closest(".modal-footer")));

    await waitFor(() => {
      expect(deleteCountry).toHaveBeenCalledWith(1);
    });
  });

  it("renders the search input", async () => {
    fetchCountries.mockResolvedValueOnce(PAGE_1_RESPONSE);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    expect(screen.getByPlaceholderText("Search countries...")).toBeInTheDocument();
  });

  it("calls fetchCountries with search param when typing", async () => {
    fetchCountries
      .mockResolvedValueOnce(PAGE_1_RESPONSE)
      .mockResolvedValueOnce({
        countries: [{ id: 1, name: "India", code: "IN" }],
        pagination: { current_page: 1, per_page: 10, total_count: 1, total_pages: 1 },
      });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.change(screen.getByPlaceholderText("Search countries..."), { target: { value: "ind" } });

    await waitFor(() => {
      expect(fetchCountries).toHaveBeenLastCalledWith({ page: 1, perPage: 10, search: "ind" });
    });
  });

  it("resets page to 1 when search term changes", async () => {
    fetchCountries
      .mockResolvedValueOnce(MULTI_PAGE_RESPONSE_P1)
      .mockResolvedValueOnce(MULTI_PAGE_RESPONSE_P2)
      .mockResolvedValueOnce({
        countries: [{ id: 1, name: "India", code: "IN" }],
        pagination: { current_page: 1, per_page: 10, total_count: 1, total_pages: 1 },
      });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    // Go to page 2 first
    fireEvent.click(screen.getByText("›"));
    await waitFor(() => expect(fetchCountries).toHaveBeenCalledTimes(2));

    // Now search — should reset to page 1
    fireEvent.change(screen.getByPlaceholderText("Search countries..."), { target: { value: "ind" } });

    await waitFor(() => {
      expect(fetchCountries).toHaveBeenLastCalledWith({ page: 1, perPage: 10, search: "ind" });
    });
  });

  it("shows empty state when no countries", async () => {
    fetchCountries.mockResolvedValueOnce({
      countries: [],
      pagination: { current_page: 1, per_page: 10, total_count: 0, total_pages: 0 },
    });

    render(<CountriesList globalSearch="" />);

    expect(await screen.findByText("No countries found")).toBeInTheDocument();
  });

  it("renders the Import CSV/Excel button", async () => {
    fetchCountries.mockResolvedValueOnce(PAGE_1_RESPONSE);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    expect(screen.getByText("📥 Import CSV/Excel")).toBeInTheDocument();
  });

  it("triggers file input when Import button is clicked", async () => {
    fetchCountries.mockResolvedValueOnce(PAGE_1_RESPONSE);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    const fileInput = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(fileInput, "click");

    fireEvent.click(screen.getByText("📥 Import CSV/Excel"));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("imports a CSV file and shows success result", async () => {
    fetchCountries.mockResolvedValue(PAGE_1_RESPONSE);
    bulkImportCountries.mockResolvedValueOnce({
      message: "Import complete",
      imported: 3,
      updated: 1,
      skipped: 0,
    });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["name,code\nGermany,DE"], "countries.csv", { type: "text/csv" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(bulkImportCountries).toHaveBeenCalledWith(file);
      expect(screen.getByText(/Import complete/)).toBeInTheDocument();
      expect(screen.getByText(/Imported: 3/)).toBeInTheDocument();
    });
  });

  it("shows error message when import fails", async () => {
    fetchCountries.mockResolvedValue(PAGE_1_RESPONSE);
    bulkImportCountries.mockRejectedValueOnce(new Error("Invalid file format"));

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["bad data"], "bad.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid file format/)).toBeInTheDocument();
      expect(screen.getByText(/Imported: 0/)).toBeInTheDocument();
    });
  });

  it("accepts .csv, .xlsx, .xls file types", async () => {
    fetchCountries.mockResolvedValueOnce({
      countries: [],
      pagination: { current_page: 1, per_page: 10, total_count: 0, total_pages: 0 },
    });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("No countries found");

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput.getAttribute("accept")).toBe(".csv,.xlsx,.xls");
  });
});
