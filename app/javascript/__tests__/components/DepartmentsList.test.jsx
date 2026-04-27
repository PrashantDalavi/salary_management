import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DepartmentsList from "../../components/Departments/DepartmentsList";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchCountries,
  bulkImportDepartments,
} from "../../services/api";

jest.mock("../../services/api", () => ({
  fetchDepartments: jest.fn(),
  createDepartment: jest.fn(),
  updateDepartment: jest.fn(),
  deleteDepartment: jest.fn(),
  fetchCountries: jest.fn(),
  bulkImportDepartments: jest.fn(),
}));

const DEPARTMENTS_PAGE_1 = {
  departments: [
    { id: 1, name: "Engineering", code: "ENG", country: { id: 1, name: "India", code: "IN" } },
    { id: 2, name: "Marketing", code: "MKT", country: { id: 2, name: "USA", code: "US" } },
  ],
  pagination: { current_page: 1, per_page: 10, total_count: 2, total_pages: 1 },
};

const DEPARTMENTS_EMPTY = {
  departments: [],
  pagination: { current_page: 1, per_page: 10, total_count: 0, total_pages: 0 },
};

const COUNTRIES_LIST = {
  countries: [
    { id: 1, name: "India" },
    { id: 2, name: "USA" },
  ]
};

describe("DepartmentsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders department rows with pagination info", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);

    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Marketing")).toBeInTheDocument();
    expect(screen.getByText("2 departments")).toBeInTheDocument();
    expect(screen.getByText(/Showing 1–2 of 2/)).toBeInTheDocument();
    expect(screen.getByText("India (IN)")).toBeInTheDocument();
    expect(screen.getByText("USA (US)")).toBeInTheDocument();
  });

  it("calls fetchDepartments with page and perPage params", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    expect(fetchDepartments).toHaveBeenCalledWith({ page: 1, perPage: 10 });
  });

  it("opens add modal and creates a department", async () => {
    fetchDepartments.mockResolvedValue(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValue(COUNTRIES_LIST);
    createDepartment.mockResolvedValue({ id: 3, name: "HR", code: "HR" });

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    fireEvent.click(screen.getByText("+ Add Department"));

    expect(screen.getByText("Add Department")).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    const nameInput = inputs.find(input => input.getAttribute("name") === "name");
    const codeInput = inputs.find(input => input.getAttribute("name") === "code");
    const countrySelect = screen.getByRole("combobox", { name: "" }); // Because label isn't directly tied or just get by name

    fireEvent.change(nameInput, { target: { name: "name", value: "HR" } });
    fireEvent.change(codeInput, { target: { name: "code", value: "HR" } });
    fireEvent.change(countrySelect, { target: { name: "country_id", value: "1" } });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(createDepartment).toHaveBeenCalledWith({ name: "HR", code: "HR", country_id: "1" });
    });
  });

  it("opens edit modal and updates a department", async () => {
    fetchDepartments.mockResolvedValue(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValue(COUNTRIES_LIST);
    updateDepartment.mockResolvedValue({ id: 1, name: "Software Eng", code: "ENG" });

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    fireEvent.click(screen.getAllByText("Edit")[0]);

    expect(screen.getByText("Edit Department")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Engineering")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Engineering"), { target: { name: "name", value: "Software Eng" } });
    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(updateDepartment).toHaveBeenCalledWith(1, { name: "Software Eng", code: "ENG", country_id: 1 });
    });
  });

  it("opens delete confirmation and deletes a department", async () => {
    fetchDepartments.mockResolvedValue(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValue(COUNTRIES_LIST);
    deleteDepartment.mockResolvedValue({});

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    fireEvent.click(screen.getAllByText("Delete")[0]);

    expect(screen.getByText("Delete Department")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Delete").find(btn => btn.closest(".modal-footer")));

    await waitFor(() => {
      expect(deleteDepartment).toHaveBeenCalledWith(1);
    });
  });

  it("shows empty state when no departments", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_EMPTY);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);

    expect(await screen.findByText("No departments found")).toBeInTheDocument();
  });

  it("renders the search input", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    expect(screen.getByPlaceholderText("Search departments...")).toBeInTheDocument();
  });

  it("filters departments by name", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    fireEvent.change(screen.getByPlaceholderText("Search departments..."), { target: { value: "eng" } });

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.queryByText("Marketing")).not.toBeInTheDocument();
  });

  it("filters departments by country name", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    fireEvent.change(screen.getByPlaceholderText("Search departments..."), { target: { value: "usa" } });

    expect(screen.getByText("Marketing")).toBeInTheDocument();
    expect(screen.queryByText("Engineering")).not.toBeInTheDocument();
  });

  it("shows no departments when search has no match", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    fireEvent.change(screen.getByPlaceholderText("Search departments..."), { target: { value: "zzzzz" } });

    expect(screen.getByText("No departments found")).toBeInTheDocument();
  });

  it("shows all departments when search is cleared", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    fireEvent.change(screen.getByPlaceholderText("Search departments..."), { target: { value: "eng" } });
    expect(screen.queryByText("Marketing")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search departments..."), { target: { value: "" } });
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Marketing")).toBeInTheDocument();
  });

  it("renders the Import CSV/Excel button", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    expect(screen.getByText("📥 Import CSV/Excel")).toBeInTheDocument();
  });

  it("triggers file input when Import button is clicked", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    const fileInput = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(fileInput, "click");

    fireEvent.click(screen.getByText("📥 Import CSV/Excel"));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("imports a CSV file and shows success result", async () => {
    fetchDepartments.mockResolvedValue(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValue(COUNTRIES_LIST);
    bulkImportDepartments.mockResolvedValueOnce({
      message: "Import completed",
      imported: 3,
      updated: 1,
      skipped: 0,
    });

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["name,code,country_code\nEngineering,ENG,IN"], "departments.csv", { type: "text/csv" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(bulkImportDepartments).toHaveBeenCalledWith(file);
      expect(screen.getByText(/Import completed/)).toBeInTheDocument();
      expect(screen.getByText(/Imported: 3/)).toBeInTheDocument();
    });
  });

  it("shows error message when import fails", async () => {
    fetchDepartments.mockResolvedValue(DEPARTMENTS_PAGE_1);
    fetchCountries.mockResolvedValue(COUNTRIES_LIST);
    bulkImportDepartments.mockRejectedValueOnce(new Error("Invalid file format"));

    render(<DepartmentsList />);
    await screen.findByText("Engineering");

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["bad data"], "bad.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid file format/)).toBeInTheDocument();
      expect(screen.getByText(/Imported: 0/)).toBeInTheDocument();
    });
  });

  it("accepts .csv, .xlsx, .xls file types", async () => {
    fetchDepartments.mockResolvedValueOnce(DEPARTMENTS_EMPTY);
    fetchCountries.mockResolvedValueOnce(COUNTRIES_LIST);

    render(<DepartmentsList />);
    await screen.findByText("No departments found");

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput.getAttribute("accept")).toBe(".csv,.xlsx,.xls");
  });
});
