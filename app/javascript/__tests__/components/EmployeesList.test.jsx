import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import EmployeesList from "../../components/Employees/EmployeesList";

describe("EmployeesList", () => {
  it("renders the page heading", () => {
    render(<EmployeesList />);
    expect(screen.getByText("Employees")).toBeInTheDocument();
  });

  it("renders the employee count subtitle", () => {
    render(<EmployeesList />);
    expect(screen.getByText("0 employees")).toBeInTheDocument();
  });

  it("renders all table column headers", () => {
    render(<EmployeesList />);
    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Last Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Job Title")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders empty state when no employees", () => {
    render(<EmployeesList />);
    expect(screen.getByText("No employees found")).toBeInTheDocument();
  });

  it("renders the Import CSV/Excel button", () => {
    render(<EmployeesList />);
    expect(screen.getByText("📥 Import CSV/Excel")).toBeInTheDocument();
  });

  it("renders the Add Employee button (disabled)", () => {
    render(<EmployeesList />);
    const addBtn = screen.getByText("+ Add Employee");
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toBeDisabled();
  });

  it("triggers file input when Import button is clicked", () => {
    render(<EmployeesList />);
    const fileInput = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(fileInput, "click");

    fireEvent.click(screen.getByText("📥 Import CSV/Excel"));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("accepts .csv, .xlsx, .xls file types", () => {
    render(<EmployeesList />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput.getAttribute("accept")).toBe(".csv,.xlsx,.xls");
  });

  it("does not render pagination when no employees", () => {
    render(<EmployeesList />);
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });
});
