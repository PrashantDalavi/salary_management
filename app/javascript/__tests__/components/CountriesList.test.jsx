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

describe("CountriesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders country rows", async () => {
    fetchCountries.mockResolvedValueOnce([
      { id: 1, name: "India", code: "IN" },
      { id: 2, name: "Japan", code: "JP" },
    ]);

    render(<CountriesList globalSearch="" />);

    expect(await screen.findByText("India")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("2 countries")).toBeInTheDocument();
  });

  it("opens add modal and creates a country", async () => {
    fetchCountries.mockResolvedValue([
      { id: 1, name: "India", code: "IN" },
    ]);
    createCountry.mockResolvedValue({ id: 2, name: "Germany", code: "DE" });

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
    fetchCountries.mockResolvedValue([
      { id: 1, name: "India", code: "IN" },
    ]);
    updateCountry.mockResolvedValue({ id: 1, name: "Republic of India", code: "IN" });

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByText("Edit Country")).toBeInTheDocument();
    expect(screen.getByDisplayValue("India")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("India"), { target: { name: "name", value: "Republic of India" } });
    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(updateCountry).toHaveBeenCalledWith(1, { name: "Republic of India", code: "IN" });
    });
  });

  it("opens delete confirmation and deletes a country", async () => {
    fetchCountries.mockResolvedValue([
      { id: 1, name: "India", code: "IN" },
    ]);
    deleteCountry.mockResolvedValue({});

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByText("Delete Country")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Delete").find(btn => btn.closest(".modal-footer")));

    await waitFor(() => {
      expect(deleteCountry).toHaveBeenCalledWith(1);
    });
  });

  it("filters countries by global search", async () => {
    fetchCountries.mockResolvedValueOnce([
      { id: 1, name: "India", code: "IN" },
      { id: 2, name: "Japan", code: "JP" },
    ]);

    render(<CountriesList globalSearch="japan" />);

    await waitFor(() => {
      expect(screen.getByText("Japan")).toBeInTheDocument();
      expect(screen.queryByText("India")).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no countries", async () => {
    fetchCountries.mockResolvedValueOnce([]);

    render(<CountriesList globalSearch="" />);

    expect(await screen.findByText("No countries found")).toBeInTheDocument();
  });

  it("renders the Import CSV/Excel button", async () => {
    fetchCountries.mockResolvedValueOnce([
      { id: 1, name: "India", code: "IN" },
    ]);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    expect(screen.getByText("📥 Import CSV/Excel")).toBeInTheDocument();
  });

  it("triggers file input when Import button is clicked", async () => {
    fetchCountries.mockResolvedValueOnce([
      { id: 1, name: "India", code: "IN" },
    ]);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("India");

    const fileInput = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(fileInput, "click");

    fireEvent.click(screen.getByText("📥 Import CSV/Excel"));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("imports a CSV file and shows success result", async () => {
    fetchCountries.mockResolvedValue([
      { id: 1, name: "India", code: "IN" },
    ]);
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
    fetchCountries.mockResolvedValue([
      { id: 1, name: "India", code: "IN" },
    ]);
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
    fetchCountries.mockResolvedValueOnce([]);

    render(<CountriesList globalSearch="" />);
    await screen.findByText("No countries found");

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput.getAttribute("accept")).toBe(".csv,.xlsx,.xls");
  });
});
