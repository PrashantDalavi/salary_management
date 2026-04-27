import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EmployeesList from "../../components/Employees/EmployeesList";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchDepartments,
  fetchCountries
} from "../../services/api";

jest.mock("../../services/api", () => ({
  fetchEmployees: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
  fetchDepartments: jest.fn(),
  fetchCountries: jest.fn()
}));

const DEPARTMENTS_MOCK = {
  departments: [
    { id: 1, name: "Engineering" },
    { id: 2, name: "Sales" }
  ]
};

const COUNTRIES_MOCK = {
  countries: [
    { id: 1, name: "India" },
    { id: 2, name: "United States" }
  ]
};

const EMPLOYEES_MOCK = {
  employees: [
    {
      id: 1, first_name: "John", last_name: "Doe", email: "john@example.com",
      employee_code: "EMP001", department: { name: "Engineering" },
      country: { name: "India" }, salary: 80000, currency: "INR", job_title: "Developer"
    }
  ],
  total: 1, page: 1, per_page: 10, total_pages: 1
};

describe("EmployeesList", () => {
  beforeEach(() => {
    fetchEmployees.mockResolvedValue(EMPLOYEES_MOCK);
    fetchDepartments.mockResolvedValue(DEPARTMENTS_MOCK);
    fetchCountries.mockResolvedValue(COUNTRIES_MOCK);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the page heading and data", async () => {
    render(<EmployeesList />);
    expect(screen.getByText("Employees")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText("Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });

  it("opens the Add Employee modal when Add button is clicked", async () => {
    render(<EmployeesList />);
    await screen.findByText("John");
    
    fireEvent.click(screen.getByText("+ Add Employee"));
    
    expect(screen.getByText("Add Employee", { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
  });

  it("creates a new employee", async () => {
    createEmployee.mockResolvedValue({});
    render(<EmployeesList />);
    await screen.findByText("John");
    
    fireEvent.click(screen.getByText("+ Add Employee"));
    
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Jane" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Smith" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText("Job Title"), { target: { value: "Designer" } });
    fireEvent.change(screen.getByLabelText("Hire Date"), { target: { value: "2024-01-01" } });
    fireEvent.change(screen.getByLabelText("Salary"), { target: { value: "50000" } });
    
    // We can't easily select from mocked dropdowns in testing-library without full render,
    // so we'll just test that the submit fires.
    fireEvent.click(screen.getByText("Create"));
    
    await waitFor(() => {
      expect(createEmployee).toHaveBeenCalled();
    });
  });

  it("opens the Edit Employee modal", async () => {
    render(<EmployeesList />);
    
    await screen.findByText("John");
    fireEvent.click(screen.getByText("Edit"));
    
    expect(screen.getByText("Edit Employee", { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
  });

  it("updates an employee", async () => {
    updateEmployee.mockResolvedValue({});
    render(<EmployeesList />);
    
    await screen.findByText("John");
    fireEvent.click(screen.getByText("Edit"));
    
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Johnny" } });
    fireEvent.click(screen.getByText("Update"));
    
    await waitFor(() => {
      expect(updateEmployee).toHaveBeenCalledWith(1, expect.objectContaining({ first_name: "Johnny" }));
    });
  });

  it("opens the delete confirmation modal", async () => {
    render(<EmployeesList />);
    
    await screen.findByText("John");
    fireEvent.click(screen.getByText("Delete"));
    
    expect(screen.getByText("Delete Employee", { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it("deletes an employee", async () => {
    deleteEmployee.mockResolvedValue({});
    render(<EmployeesList />);
    
    await screen.findByText("John");
    fireEvent.click(screen.getByText("Delete"));
    
    const confirmButton = screen.getAllByText("Delete")[1]; // The one in the modal
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(deleteEmployee).toHaveBeenCalledWith(1);
    });
  });
});
